import { CQL_BINARY_OPERATORS, CQL_FIELDS, CQL_LIST_OPERATORS, CQL_STRING_OPERATORS, CQL_UNARY_OPERATORS } from "./constants";

export type CQLTerm = BinOp | UnOp | CQLAtom;
export interface BinOp {
    operator: CQL_BINARY_OPERATORS;
    term1: CQLTerm;
    term2: CQLTerm;
}

export interface UnOp {
    operator: CQL_UNARY_OPERATORS;
    term: CQLTerm;
}

export type CQLAtom = CQLSingleAtom | CQLListAtom;

export interface CQLSingleAtom {
    operator: CQL_STRING_OPERATORS;
    field: CQL_FIELDS;
    value: string;
}

export interface CQLListAtom {
    operator: CQL_LIST_OPERATORS;
    field: CQL_FIELDS;
    value: string[];
}

