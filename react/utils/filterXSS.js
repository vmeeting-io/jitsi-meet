export default function filteringXSS(origin) {
    return origin.replace(/\<|\>|\"|\'|\%|\;|\(|\)|\&|\+|\-/g, "");
}
