
# Simple CQL Grammar
* CQLTerm := BinOp | UnOp | CQLAtom
* BinOp := \<CQLTerm><Binary_Operator>\<CQLTerm>
* Binary_Operator := "or" | "and"
* UnOp := \<Unary_Operator>\<CQLTerm>
* CQLAtom :=  \<CQLSingleAtom> | \<CQLListAtom> | "(" \<CQLTerm> ")"
* CQLSingleAtom := \<Field>\<CQL_STRING_OPERATORS>\"\<word>\"
* Field := "ancestor" | "creator" | "label" | "parent" | "space" | "title"
* CQL_STRING_OPERATORS := "=" | "!=" | "~" | "!\~"
* CQLListAtom := \<Field>\<CQL_List_Operators>\<list>
* list := "("\<list1>
* list1 := \<word> | \<word>\<restList>
* restList := ")" | ","\<list1>

## Removing Left Recursion from Grammar
1. CQLTerm := \<CQLTerm>\<BINARY_Operator>\<CQLTerm>  |            \<Unary_Operator>\<CQLTerm> 
| \<Field>\<CQL_STRING_OPERATORS>\"\<word>\" |      \<Field>\<CQL_List_Operators>\<list> | "(" \<CQLTerm> ")"

2. CQLTerm := <Unary_Operator><CQLTerm><CQLTerm'> 
        | <Field><CQL_STRING_OPERATORS>\"<word>\"<CqlTerm'> 
        | <Field><CQL_List_Operators><list><CqlTerm'>
        | "("\<CQLTerm> ")"<CQLTerm'>

    CQLTerm' := empty | \<BINARY_Operator>\<CQLTerm>\<CQLTerm'>

## Redefined Grammar

* CQLTerm := \<SubTerm>("or"\<SubTerm>)*
* SubTerm :=\<UnopTerm>("and"\<UnopTerm>)*
* UnopTerm := ("not")?\<CQLAtom>
* CQLAtom :=  \<CQLSingleAtom> | \<CQLListAtom> | "(" \<CQLTerm> ")"
* CQLSingleAtom := \<Field>\<CQL_STRING_OPERATORS>\"\<word>\"
* Field := "ancestor" | "creator" | "label" | "parent" | "space" | "title"
* CQL_STRING_OPERATORS := "=" | "!=" | "~" | "!~"
* CQLListAtom := \<Field>\<CQL_List_Operators>\<list>
* list := "("\<list1>
* list1 := \<word> | \<word>\<restList>
* restList := ")" | ","\<list1>

