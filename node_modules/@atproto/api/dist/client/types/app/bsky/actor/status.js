"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIVE = void 0;
exports.isRecord = isRecord;
exports.validateRecord = validateRecord;
const lexicons_1 = require("../../../../lexicons");
const util_1 = require("../../../../util");
const is$typed = util_1.is$typed, validate = lexicons_1.validate;
const id = 'app.bsky.actor.status';
const hashRecord = 'main';
function isRecord(v) {
    return is$typed(v, id, hashRecord);
}
function validateRecord(v) {
    return validate(v, id, hashRecord, true);
}
/** Advertises an account as currently offering live content. */
exports.LIVE = `${id}#live`;
//# sourceMappingURL=status.js.map