export enum CQL_BINARY_OPERATORS {
    OR,
    AND
}

export enum CQL_UNARY_OPERATORS {
    NOT
}

export enum CQL_STRING_OPERATORS {
    EQUALS,
    NOT_EQUALS,
    // Might include numeric operators later
    // GREATER_THAN,
    // GREATER_THAN_EQUALS,
    // LESS_THAN,
    // LESS_THAN_EQUALS,
    CONTAINS,
    NOT_CONTAINS
}

export enum CQL_LIST_OPERATORS {
    IN,
    NOT_IN
}

export enum CQL_FIELDS {
    ANCESTOR,
    CREATOR,
    LABEL,
    PARENT,
    SPACE,
    TITLE
}