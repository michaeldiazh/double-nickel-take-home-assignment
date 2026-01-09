"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertUserRowSchema = exports.userRoleRowSchema = exports.simplifiedUserRowSchema = exports.simplifiedUserDomainKeyToTableKey = exports.userDomainKeyToTableKey = exports.insertUserRowShape = exports.simplifiedUserShape = void 0;
const zod_1 = require("zod");
const address_1 = require("../address");
exports.simplifiedUserShape = {
    id: zod_1.z.uuidv4(),
    first_name: zod_1.z.string(),
    last_name: zod_1.z.string(),
    email: zod_1.z.email(),
    address_id: zod_1.z.uuidv4(),
    last_logged_in: zod_1.z.date().nullable(),
};
exports.insertUserRowShape = {
    first_name: zod_1.z.string(),
    last_name: zod_1.z.string(),
    email: zod_1.z.email(),
    password_hash: zod_1.z.string(),
    address_id: zod_1.z.uuidv4()
};
exports.userDomainKeyToTableKey = {
    id: 'id',
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    address: address_1.addressDomainKeyToTableKey,
    lastLoggedIn: 'last_logged_in',
    passwordHash: undefined,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
};
exports.simplifiedUserDomainKeyToTableKey = {
    id: 'id',
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    addressId: 'address_id',
};
exports.simplifiedUserRowSchema = zod_1.z.object(exports.simplifiedUserShape);
exports.userRoleRowSchema = exports.simplifiedUserRowSchema.extend({
    password_hash: zod_1.z.string(),
    created_at: zod_1.z.date(),
    updated_at: zod_1.z.date(),
});
exports.insertUserRowSchema = zod_1.z.object(exports.insertUserRowShape);
