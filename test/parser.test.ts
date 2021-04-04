import { parseCql } from "../src/cql/parser/parser";
import { BinOp, CQLAtom } from "../src/types/cql";
import { InvalidQueryError } from "../src/cql/parser/error";
import { CQL_BINARY_OPERATORS, CQL_FIELDS, CQL_STRING_OPERATORS } from "../src/cql/parser/constants";

const titleQuery: CQLAtom = {
    operator: CQL_STRING_OPERATORS.CONTAINS,
    keyword: CQL_FIELDS.TITLE,
    value: "auto"
};

const spaceQuery: CQLAtom = {
    operator: CQL_STRING_OPERATORS.EQUALS,
    keyword: CQL_FIELDS.SPACE,
    value: "dev"
};

const labelQuery: CQLAtom = {
    operator: CQL_STRING_OPERATORS.EQUALS,
    keyword: CQL_FIELDS.LABEL,
    value: "test"
};

const multQuery: BinOp = {
    operator: CQL_BINARY_OPERATORS.AND,
    term1: titleQuery,
    term2: spaceQuery,
};

const multQuery2: BinOp = {
    operator: CQL_BINARY_OPERATORS.AND,
    term1: spaceQuery,
    term2: titleQuery,
};

const precedenceQuery: BinOp = {
    operator: CQL_BINARY_OPERATORS.OR,
    term1: labelQuery,
    term2: multQuery2
};

describe("CQL Parser", () => {
    test("Can parse title query", () => {
        expect(parseCql("title ~ \"auto\"")).toEqual(titleQuery);
    });

    test("Is case insensitive", () => {
        expect(parseCql("title ~ \"AUTO\"")).toEqual(titleQuery);
    });

    test("Allows sigle quotes", () => {
        expect(parseCql( "title ~ 'auto'")).toEqual(titleQuery);
    });

    test("Force quotation marks", () => {
        expect(() => parseCql( "title ~ auto")).toThrowError(InvalidQueryError);
    });

    test("Can parse space query", () => {
        expect(parseCql("space = 'DEV'")).toEqual(spaceQuery);
    });


    test("Can join 2 queries together", () => {
        expect(parseCql("title ~ \"auto\" AND space = 'DEV'"))
        .toEqual(multQuery);
    });

    test("Ignores brackets", () => {
        expect(parseCql("(title ~ \"auto\") AND (space = 'DEV')")).toEqual(multQuery);
    });

    test("Test Associativity", () => {
        expect(parseCql("space = 'DEV' AND title ~ \"auto\"")).toEqual(multQuery2);
    });

    test("Invalid Parse", () => {
        expect(() => parseCql("xyz")).toThrowError(InvalidQueryError);
    });

    test("Correct precedence", () => {
        expect(parseCql("label = 'test' OR space = 'DEV' AND title ~ \"auto\"")).toEqual(precedenceQuery);
    });

});


