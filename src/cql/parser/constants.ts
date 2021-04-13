export enum CQL_BINARY_OPERATORS {
    OR = "or",
    AND = "and"
}

export enum CQL_UNARY_OPERATORS {
    NOT = "not"
}

export enum CQL_STRING_OPERATORS {
    EQUALS = "=",
    NOT_EQUALS = "!=",
    // Might include numeric operators later
    // GREATER_THAN,
    // GREATER_THAN_EQUALS,
    // LESS_THAN,
    // LESS_THAN_EQUALS,
    CONTAINS = "~",
    NOT_CONTAINS = "!~"
}

export enum CQL_LIST_OPERATORS {
    IN = "in",
    NOT_IN = "not_in"
}

export enum CQL_FIELDS {
    ANCESTOR = "ancestor",
    CREATOR = "creator",
    LABEL = "label",
    PARENT = "parent",
    SPACE = "space",
    TITLE = "title",
    TYPE = "type"
}
