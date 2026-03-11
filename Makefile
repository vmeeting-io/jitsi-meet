BUILD_DIR = build
CLEANCSS = ./node_modules/.bin/cleancss
DEPLOY_DIR = libs
LIBJITSIMEET_DIR = node_modules/lib-jitsi-meet
OLM_DIR = node_modules/@matrix-org/olm
TF_WASM_DIR = node_modules/@tensorflow/tfjs-backend-wasm/dist/
RNNOISE_WASM_DIR = node_modules/@jitsi/rnnoise-wasm/dist
EXCALIDRAW_DIR = node_modules/@jitsi/excalidraw/dist/excalidraw-assets
EXCALIDRAW_DIR_DEV = node_modules/@jitsi/excalidraw/dist/excalidraw-assets-dev
TFLITE_WASM = react/features/stream-effects/virtual-background/vendor/tflite
MEET_MODELS_DIR  = react/features/stream-effects/virtual-background/vendor/models
FACE_DETECT_MODELS_DIR = react/features/face-detect/models
FACE_MODELS_DIR = node_modules/@vladmandic/human-models/models
NODE_SASS = ./node_modules/.bin/sass
NPM = npm
OUTPUT_DIR = .
STYLES_BUNDLE = css/all.bundle.css
STYLES_DESTINATION = css/all.css
STYLES_MAIN = css/main.scss
ifeq ($(OS),Windows_NT)
	WEBPACK = .\node_modules\.bin\webpack
	WEBPACK_DEV_SERVER = .\node_modules\.bin\webpack serve --mode development
else
	WEBPACK = ./node_modules/.bin/webpack
	WEBPACK_DEV_SERVER = ./node_modules/.bin/webpack serve --mode development
endif
LANGUAGES := $(shell node -p "Object.keys(require('./lang/languages.json')).join(' ')")
COUNTRIES_DIR := node_modules/i18n-iso-countries/langs
DEV_COUNTRIES_DIR := lang/countries

all: compile deploy clean

compile:
	NODE_OPTIONS=--max-old-space-size=8192 \
	$(WEBPACK)

clean:
	rm -fr $(BUILD_DIR)

.NOTPARALLEL:
deploy: deploy-init deploy-appbundle deploy-rnnoise-binary deploy-excalidraw deploy-tflite deploy-meet-models deploy-face-detect-models deploy-lib-jitsi-meet deploy-olm deploy-tf-wasm deploy-css deploy-local deploy-face-landmarks $(LANGUAGES)

deploy-init:
	rm -fr $(DEPLOY_DIR)
	mkdir -p $(DEPLOY_DIR)

deploy-appbundle:
	cp \
		$(BUILD_DIR)/*.min.js \
		$(BUILD_DIR)/*.min.js.map \
		$(DEPLOY_DIR) || true

deploy-lib-jitsi-meet:
	cp \
		$(LIBJITSIMEET_DIR)/dist/umd/lib-jitsi-meet.* \
		$(DEPLOY_DIR)

deploy-olm:
	cp \
		$(OLM_DIR)/olm.wasm \
		$(DEPLOY_DIR)

deploy-tf-wasm:
	cp \
		$(TF_WASM_DIR)/*.wasm \
		$(DEPLOY_DIR)

deploy-rnnoise-binary:
	cp \
		$(RNNOISE_WASM_DIR)/rnnoise.wasm \
		$(DEPLOY_DIR)

deploy-tflite:
	cp \
		$(TFLITE_WASM)/*.wasm \
		$(DEPLOY_DIR)

deploy-excalidraw:
	cp -R \
		$(EXCALIDRAW_DIR) \
		$(DEPLOY_DIR)/

deploy-excalidraw-dev:
	cp -R \
		$(EXCALIDRAW_DIR_DEV) \
		$(DEPLOY_DIR)/

deploy-meet-models:
	cp \
		$(MEET_MODELS_DIR)/*.tflite \
		$(DEPLOY_DIR)

deploy-face-detect-models:
	cp -rf \
		$(FACE_DETECT_MODELS_DIR)/* \
		$(DEPLOY_DIR)

deploy-face-landmarks:
	cp \
		$(FACE_MODELS_DIR)/blazeface-front.bin \
		$(FACE_MODELS_DIR)/blazeface-front.json \
		$(FACE_MODELS_DIR)/emotion.bin \
		$(FACE_MODELS_DIR)/emotion.json \
		$(DEPLOY_DIR)

deploy-css:
	$(NODE_SASS) $(STYLES_MAIN) $(STYLES_BUNDLE) && \
	$(CLEANCSS) --skip-rebase $(STYLES_BUNDLE) > $(STYLES_DESTINATION) && \
	rm $(STYLES_BUNDLE)

deploy-local:
	([ ! -x deploy-local.sh ] || ./deploy-local.sh)

$(LANGUAGES):
	LOCALE=$$(echo $@ | cut -c1-2) ; \
	if [ -f $(COUNTRIES_DIR)/$@.json ] ; \
	then \
		cp -f $(COUNTRIES_DIR)/$@.json ./lang/countries-$@.json; \
	else \
		if [ -f $(COUNTRIES_DIR)/$$LOCALE.json ] ; \
		then \
			cp -f $(COUNTRIES_DIR)/$$LOCALE.json ./lang/countries-$@.json; \
		fi; \
	fi;

.NOTPARALLEL:
dev: deploy-css deploy-rnnoise-binary deploy-tflite deploy-meet-models deploy-lib-jitsi-meet deploy-olm deploy-tf-wasm deploy-excalidraw-dev deploy-face-landmarks deploy-face-detect-models $(LANGUAGES)
	if [ ! -d $(DEV_COUNTRIES_DIR) ] ; \
	then \
		mkdir $(DEV_COUNTRIES_DIR); \
	fi; \
	cp -rf lang/countries-*.json $(DEV_COUNTRIES_DIR)/

dev-start: deploy-lib-jitsi-meet
	./cssmon.sh ./css &
	$(WEBPACK_DEV_SERVER)

source-package:
	mkdir -p source_package/jitsi-meet/css && \
	cp -r *.js *.html resources/*.txt fonts images libs static sounds LICENSE lang source_package/jitsi-meet && \
	cp css/all.css source_package/jitsi-meet/css && \
	(cd source_package ; tar cjf ../jitsi-meet.tar.bz2 jitsi-meet) && \
	rm -rf source_package

.PHONY: $(LANGUAGES)
