import { CQL_BINARY_OPERATORS, CQL_FIELDS, CQL_LIST_OPERATORS, CQL_STRING_OPERATORS, CQL_UNARY_OPERATORS } from "../cql/parser/constants";

export type CQLTerm = BinOp | UnOp | CQLAtom
interface BinOp {
    operator: CQL_BINARY_OPERATORS;
    term1: CQLTerm;
    term2: CQLTerm;
}

interface UnOp {
    operator: CQL_UNARY_OPERATORS;
    term: CQLTerm;
}

type CQLAtom = CQLSingleAtom | CQLListAtom;

interface CQLSingleAtom {
    operator: CQL_STRING_OPERATORS;
    field: CQL_FIELDS;
    value: string;
}

interface CQLListAtom {
    operator: CQL_LIST_OPERATORS;
    field: CQL_FIELDS;
    value: string[];
}

