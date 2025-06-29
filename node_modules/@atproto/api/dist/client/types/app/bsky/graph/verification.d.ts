/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { type ValidationResult } from '@atproto/lexicon';
export interface Record {
    $type: 'app.bsky.graph.verification';
    /** DID of the subject the verification applies to. */
    subject: string;
    /** Handle of the subject the verification applies to at the moment of verifying, which might not be the same at the time of viewing. The verification is only valid if the current handle matches the one at the time of verifying. */
    handle: string;
    /** Display name of the subject the verification applies to at the moment of verifying, which might not be the same at the time of viewing. The verification is only valid if the current displayName matches the one at the time of verifying. */
    displayName: string;
    /** Date of when the verification was created. */
    createdAt: string;
    [k: string]: unknown;
}
export declare function isRecord<V>(v: V): v is import("../../../../util").$TypedObject<V, "app.bsky.graph.verification", "main">;
export declare function validateRecord<V>(v: V): ValidationResult<Record & V>;
//# sourceMappingURL=verification.d.ts.map