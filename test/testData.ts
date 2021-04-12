import { BinOp, CQLAtom, CQLListAtom, CQLSingleAtom, CQLTerm, UnOp } from "cql";
import { CQL_BINARY_OPERATORS, CQL_FIELDS, CQL_LIST_OPERATORS, CQL_STRING_OPERATORS, CQL_UNARY_OPERATORS } from "../src/cql/parser/constants";


export const makeTitleQuery = (value: string): CQLSingleAtom => makeSimpleQuery(CQL_STRING_OPERATORS.CONTAINS,value, CQL_FIELDS.TITLE);

export const makeSpaceQuery = (value: string): CQLSingleAtom => makeSimpleQuery(CQL_STRING_OPERATORS.EQUALS,value, CQL_FIELDS.SPACE);

export const makeLabelQuery = (value: string[]): CQLListAtom => ({
    operator: CQL_LIST_OPERATORS.IN,
    field: CQL_FIELDS.LABEL,
    value
});

export const makeSimpleQuery = (operator: CQL_STRING_OPERATORS, value: string, field: CQL_FIELDS): CQLSingleAtom => ({
    operator,
    field,
    value
});

export const makeOrQuery = (term1: CQLTerm, term2: CQLTerm): BinOp => ({
    operator: CQL_BINARY_OPERATORS.OR,
    term1,
    term2,
});

export const makeAndQuery = (term1: CQLTerm, term2: CQLTerm): BinOp => ({
    operator: CQL_BINARY_OPERATORS.AND,
    term1,
    term2,
});

export const makeListQuery = (operator: CQL_LIST_OPERATORS, value: string[], field: CQL_FIELDS): CQLListAtom => ({
    operator,
    field,
    value
});


const titleQuery = makeTitleQuery("auto");
export const spaceQuery: CQLAtom = makeSpaceQuery("dev");

export const labelQuery: CQLAtom = {
    operator: CQL_STRING_OPERATORS.EQUALS,
    field: CQL_FIELDS.LABEL,
    value: "test"
};

export const labelListQuery: CQLAtom = {
    operator: CQL_LIST_OPERATORS.IN,
    field: CQL_FIELDS.LABEL,
    value: ["test", "dev", "abc"]
};

export const labelListNegQuery: CQLAtom = {
    operator: CQL_LIST_OPERATORS.NOT_IN,
    field: CQL_FIELDS.LABEL,
    value: ["test", "dev", "abc"]
};

export const multipleAndQuery: BinOp = {
    operator: CQL_BINARY_OPERATORS.AND,
    term1: titleQuery,
    term2: spaceQuery,
};

export const multipleOrQuery: BinOp = {
    operator: CQL_BINARY_OPERATORS.OR,
    term1: titleQuery,
    term2: spaceQuery,
};

export const multipleAndQuery2: BinOp = {
    operator: CQL_BINARY_OPERATORS.AND,
    term1: spaceQuery,
    term2: titleQuery,
};

export const multipleChainAndQuery: BinOp = {
    operator: CQL_BINARY_OPERATORS.AND,
    term1: labelQuery,
    term2: multipleAndQuery
}; 

export const multipleChainOrQuery: BinOp = {
    operator: CQL_BINARY_OPERATORS.OR,
    term1: labelQuery,
    term2: multipleOrQuery
}; 
export const precedenceQuery: BinOp = {
    operator: CQL_BINARY_OPERATORS.OR,
    term1: labelQuery,
    term2: multipleAndQuery2
};

export const precedenceQuery2: BinOp = {
    operator: CQL_BINARY_OPERATORS.AND,
    term1: {
        operator: CQL_BINARY_OPERATORS.OR,
        term1: labelQuery,
        term2: spaceQuery
    },
    term2: titleQuery
};

export const notQuery: UnOp = {
    operator: CQL_UNARY_OPERATORS.NOT,
    term: titleQuery,
};

