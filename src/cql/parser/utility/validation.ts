// these characters aren't valid for label fields
import {CQLAtom} from "../types";
import {CQL_FIELDS, CQL_LIST_OPERATORS, CQL_STRING_OPERATORS} from "../constants";
import {F, SingleParser} from "@masala/parser";

const INVALID_LABEL_CHARACTERS = "!#&()*,.:;<>@[]^";

// checks if the label given contains any invalid characters
function isValidLabel(val: string | string[]): boolean {

    const isValid = (label: string): boolean => {
        // create set for checking if any invalid label characters are in the string
        const intersectionSet = [...INVALID_LABEL_CHARACTERS].filter(x => new Set(label).has(x));
        return intersectionSet.length === 0;
    };

    if (typeof val === "string") {
        return isValid(val);
    } else {
        return !(val.map(isValid).includes(false));
    }

}

function isNumber(x: string): boolean {
    // check if any non-digit is in string
    return !/\D/.test(x);
}

function isAlphaNum(x: string): boolean {
    return /^[0-9a-z]+$/.test(x);
}

function isValueValid(value: string | string[], isValid: (val: string) => boolean) {
    if (typeof value === "string") {
        return isValid(value);
    } else {
        // if any of them are invalid, return false
        // valid(A) && valid(B) = ! (!Valid(A) || !(Valid(B))
        return !value.some((x) => !isValid(x));
    }
}

function isValidCqlField(cqlAtom: CQLAtom): boolean {
    switch (cqlAtom.field) {
        case CQL_FIELDS.LABEL:
            return isValueValid(cqlAtom.value, isValidLabel);
        case CQL_FIELDS.PARENT:
        case CQL_FIELDS.ANCESTOR:
            return isValueValid(cqlAtom.value, isNumber);
        case CQL_FIELDS.SPACE:
        case CQL_FIELDS.CREATOR:
            return isValueValid(cqlAtom.value, isAlphaNum);
        case CQL_FIELDS.TYPE:
            return isValueValid(cqlAtom.value, (x) => new Set(["page", "attachment", "comment", "blogpost"]).has(x));
        default:
            return true;
    }
}

function isValidCqlOperator(cqlAtom: CQLAtom): boolean {
    switch (cqlAtom.operator) {
        case CQL_LIST_OPERATORS.IN:
        case CQL_LIST_OPERATORS.NOT_IN:
            return !(cqlAtom.field === CQL_FIELDS.PARENT || cqlAtom.field === CQL_FIELDS.TITLE);
        case CQL_STRING_OPERATORS.CONTAINS:
        case CQL_STRING_OPERATORS.NOT_CONTAINS:
            return cqlAtom.field === CQL_FIELDS.TITLE;
        default: // = and != are valid for all fields
            return true;
    }
}

// Given a cql Atom returns whether the cql is valid i.e using the correct field and operator
export function isValidCQLAtom(cqlAtom: CQLAtom): boolean {
    /*
       Some fields only work with some operators
       These tests are to make sure that this is enforced
       ancestor:  =, !=, in, not in
       creator: =, !=, in, not in
       label: =, !=, in, not in
       parent: =,!=
       space:  =, !=, in, not in
       title:  =, !=, ~, !~
    */
    return isValidCqlField(cqlAtom) && isValidCqlOperator(cqlAtom);

}

export function validateCqlAtom(term: CQLAtom): SingleParser<CQLAtom | null> {
    if (isValidCQLAtom(term)) {
        return F.returns(term);
    } else {
        return F.error().returns(null);
    }
}
