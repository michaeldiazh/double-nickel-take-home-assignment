import {z} from "zod";
import {User, SimplifiedUser} from "./domain";
import {addressDomainKeyToTableKey as addressDomainToKeyMap} from "../address";
import {KeyTranslator} from "../../services/filters/where-filter";

export const simplifiedUserShape = {
    id: z.uuidv4(),
    first_name: z.string(),
    last_name: z.string(),
    email: z.email(),
    address_id: z.uuidv4(),
    last_logged_in: z.date().nullable(),
}
export const insertUserRowShape = {
    first_name: z.string(),
    last_name: z.string(),
    email: z.email(),
    password_hash: z.string(),
    address_id: z.uuidv4()
}
export const userDomainKeyToTableKey: KeyTranslator<User> = {
    id: 'id',
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    address: addressDomainToKeyMap,
    lastLoggedIn: 'last_logged_in',
    passwordHash: undefined,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
};

export const simplifiedUserDomainKeyToTableKey: KeyTranslator<SimplifiedUser> = {
    id: 'id',
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    addressId: 'address_id',
};
export const simplifiedUserRowSchema = z.object(simplifiedUserShape);

export type SimplifiedUserRow = z.infer<typeof simplifiedUserRowSchema>;

export const userRoleRowSchema = simplifiedUserRowSchema.extend(
    {
        password_hash: z.string(),
        created_at: z.date(),
        updated_at: z.date(),
    }
)
export const insertUserRowSchema = z.object(insertUserRowShape);
export type UserRow = z.infer<typeof userRoleRowSchema>;