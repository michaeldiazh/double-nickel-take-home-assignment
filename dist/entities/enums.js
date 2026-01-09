"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requirementStatusSchema = exports.RequirementStatus = exports.messageSenderSchema = exports.MessageSender = exports.screeningDecisionSchema = exports.ScreeningDecision = exports.applicationStatusSchema = exports.ApplicationStatus = exports.paymentTypeSchema = exports.PaymentType = void 0;
const zod_1 = require("zod");
/**
 * Payment type enum for Job table
 */
var PaymentType;
(function (PaymentType) {
    PaymentType["HOUR"] = "HOUR";
    PaymentType["MILES"] = "MILES";
    PaymentType["SALARY"] = "SALARY";
})(PaymentType || (exports.PaymentType = PaymentType = {}));
/**
 * Zod schema for PaymentType enum
 */
exports.paymentTypeSchema = zod_1.z.enum(Object.values(PaymentType));
/**
 * Application status enum
 */
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["SUBMITTED"] = "SUBMITTED";
    ApplicationStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ApplicationStatus["WITHDRAWN"] = "WITHDRAWN";
    ApplicationStatus["HIRED"] = "HIRED";
    ApplicationStatus["REJECTED"] = "REJECTED";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
/**
 * Zod schema for ApplicationStatus enum
 */
exports.applicationStatusSchema = zod_1.z.enum(Object.values(ApplicationStatus));
/**
 * Screening decision enum for Conversation table
 */
var ScreeningDecision;
(function (ScreeningDecision) {
    ScreeningDecision["APPROVED"] = "APPROVED";
    ScreeningDecision["DENIED"] = "DENIED";
    ScreeningDecision["PENDING"] = "PENDING";
})(ScreeningDecision || (exports.ScreeningDecision = ScreeningDecision = {}));
/**
 * Zod schema for ScreeningDecision enum
 */
exports.screeningDecisionSchema = zod_1.z.enum(Object.values(ScreeningDecision));
/**
 * Message sender enum
 */
var MessageSender;
(function (MessageSender) {
    MessageSender["USER"] = "USER";
    MessageSender["ASSISTANT"] = "ASSISTANT";
    MessageSender["SYSTEM"] = "SYSTEM";
})(MessageSender || (exports.MessageSender = MessageSender = {}));
/**
 * Zod schema for MessageSender enum
 */
exports.messageSenderSchema = zod_1.z.enum(Object.values(MessageSender));
/**
 * Requirement status enum for ConversationRequirements
 */
var RequirementStatus;
(function (RequirementStatus) {
    RequirementStatus["PENDING"] = "PENDING";
    RequirementStatus["MET"] = "MET";
    RequirementStatus["NOT_MET"] = "NOT_MET";
})(RequirementStatus || (exports.RequirementStatus = RequirementStatus = {}));
/**
 * Zod schema for RequirementStatus enum
 */
exports.requirementStatusSchema = zod_1.z.enum(Object.values(RequirementStatus));
