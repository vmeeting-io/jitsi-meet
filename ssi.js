'use strict';

const fs = require('fs');
const path = require('path');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.map': 'application/json',
    '.wasm': 'application/wasm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.txt': 'text/plain; charset=utf-8',
};

function createResolver(root, configDir) {
    function resolveConfigJs(pathname) {
        const match = pathname.match(/^\/([^/]+)\/config\.js$/);
        if (match) {
            const subdomainFile = path.join(configDir, `config.${match[1]}.js`);
            if (fs.existsSync(subdomainFile)) {
                return subdomainFile;
            }
            return path.join(configDir, 'config.js');
        }
        return path.join(configDir, 'config.js');
    }

    function resolvePath(pathname) {
        if (pathname === '/config.js' || pathname.match(/^\/[^/]+\/config\.js$/)) {
            return resolveConfigJs(pathname);
        }
        if (pathname === '/interface_config.js') {
            return path.join(configDir, 'interface_config.js');
        }
        if (pathname === '/title.html') {
            return path.join(configDir, 'title.html');
        }
        if (pathname === '/external_api.js') {
            return path.join(root, 'libs', 'external_api.min.js');
        }

        const customMatch = pathname.match(/^\/custom-(static|images|fonts|lang|sounds)\/(.*)$/);
        if (customMatch) {
            return path.join(configDir, `custom-${customMatch[1]}`, customMatch[2]);
        }

        const relative = decodeURIComponent(pathname.replace(/^\//, ''));
        if (!relative || relative.endsWith('/')) {
            return path.join(root, 'index.html');
        }

        const candidate = path.normalize(path.join(root, relative));
        if (!candidate.startsWith(root)) {
            return null;
        }

        if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
        }

        // SPA / room name fallback
        if (!relative.includes('.') || relative.indexOf('/') === -1) {
            return path.join(root, 'index.html');
        }

        const parts = relative.split('/');
        if (parts.length > 1) {
            const stripped = path.normalize(path.join(root, parts.slice(1).join('/')));
            if (stripped.startsWith(root) && fs.existsSync(stripped) && fs.statSync(stripped).isFile()) {
                return stripped;
            }
            return path.join(root, 'index.html');
        }

        return path.join(root, 'index.html');
    }

    function resolveInclude(virtualPath) {
        if (virtualPath.startsWith('/')) {
            return resolvePath(virtualPath);
        }

        const fromConfig = path.normalize(path.join(configDir, virtualPath));
        if (fromConfig.startsWith(configDir) && fs.existsSync(fromConfig) && fs.statSync(fromConfig).isFile()) {
            return fromConfig;
        }

        const fromRoot = path.normalize(path.join(root, virtualPath));
        if (fromRoot.startsWith(root) && fs.existsSync(fromRoot) && fs.statSync(fromRoot).isFile()) {
            return fromRoot;
        }

        return null;
    }

    function processSsi(content, ssiVars, depth = 0) {
        if (depth > 5) {
            return content;
        }

        let out = content.replace(
            /<!--#\s*include\s+virtual="([^"]+)"\s*-->/g,
            (match, virtualPath) => {
                const includePath = resolveInclude(virtualPath);
                if (!includePath) {
                    console.warn(`SSI include not found: ${virtualPath}`);
                    return match;
                }
                try {
                    const included = fs.readFileSync(includePath, 'utf8');
                    return processSsi(included, ssiVars, depth + 1);
                } catch (err) {
                    console.warn(`SSI include failed: ${virtualPath}`, err.message);
                    return match;
                }
            }
        );

        out = out.replace(
            /<!--#\s*echo\s+var="([^"]+)"\s*(?:default="([^"]*)")?\s*-->/g,
            (match, varName, defaultValue) => {
                if (Object.prototype.hasOwnProperty.call(ssiVars, varName)) {
                    return ssiVars[varName];
                }
                return defaultValue !== undefined ? defaultValue : '';
            }
        );

        return out;
    }

    function needsSsi(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return ext === '.html' || ext === '.js' || ext === '.htm';
    }

    return {
        resolvePath,
        resolveConfigJs,
        resolveInclude,
        processSsi,
        needsSsi,
    };
}

/**
 * Express/webpack-dev-server middleware: serve config + HTML with SSI.
 * Calls next() for everything else (compiled assets, HMR, proxy).
 */
function createSsiMiddleware(options = {}) {
    const root = options.root || process.cwd();
    const configDir = options.configDir || process.env.WEB_CONFIG_DIR || '/config';
    const { resolvePath, processSsi, needsSsi } = createResolver(root, configDir);

    return function ssiMiddleware(req, res, next) {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            next();
            return;
        }

        const pathname = (req.url || '/').split('?')[0];
        if (pathname.includes('..') || pathname.match(/\.env/)) {
            res.statusCode = 403;
            res.end('Forbidden');
            return;
        }

        // Only intercept HTML SPA routes and config-like files.
        const intercept =
            pathname === '/' ||
            pathname === '/config.js' ||
            pathname === '/interface_config.js' ||
            pathname === '/title.html' ||
            pathname.match(/^\/[^/]+\/config\.js$/) ||
            pathname.endsWith('.html') ||
            /^\/[^/.]+$/.test(pathname) ||
            /^\/[^/]+\/[^/.]+$/.test(pathname);

        if (!intercept) {
            next();
            return;
        }

        // Let webpack serve real source/static files that exist under root
        // (except index.html / config which need SSI).
        if (
            pathname !== '/' &&
            pathname !== '/config.js' &&
            pathname !== '/interface_config.js' &&
            pathname !== '/title.html' &&
            !pathname.match(/^\/[^/]+\/config\.js$/) &&
            !pathname.endsWith('.html')
        ) {
            const maybeFile = path.normalize(path.join(root, pathname.replace(/^\//, '')));
            if (
                maybeFile.startsWith(root) &&
                fs.existsSync(maybeFile) &&
                fs.statSync(maybeFile).isFile() &&
                !needsSsi(maybeFile)
            ) {
                next();
                return;
            }
        }

        const filePath = resolvePath(pathname);
        if (!filePath || !fs.existsSync(filePath)) {
            next();
            return;
        }

        const ssiVars = {
            subdomain: req.headers['x-subdomain'] || '',
        };

        // Tenant path /tenant/room → subdomain "tenant."
        const tenantMatch = pathname.match(/^\/([^/]+)\/[^/.]+$/);
        if (tenantMatch && !ssiVars.subdomain) {
            ssiVars.subdomain = `${tenantMatch[1]}.`;
        }
        const tenantConfig = pathname.match(/^\/([^/]+)\/config\.js$/);
        if (tenantConfig) {
            ssiVars.subdomain = `${tenantConfig[1]}.`;
        }

        try {
            const data = fs.readFileSync(filePath);
            const ext = path.extname(filePath).toLowerCase();
            let body = data;
            if (needsSsi(filePath)) {
                body = Buffer.from(processSsi(data.toString('utf8'), ssiVars, 0), 'utf8');
            }
            res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
            res.setHeader('Access-Control-Allow-Origin', '*');
            if (req.method === 'HEAD') {
                res.end();
                return;
            }
            res.end(body);
        } catch (err) {
            next(err);
        }
    };
}

module.exports = {
    MIME,
    createResolver,
    createSsiMiddleware,
};
