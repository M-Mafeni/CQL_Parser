
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

## Redefined Grammar

* CQLTerm := \<SubTerm>("or"\<SubTerm>)*
* SubTerm :=\<UnopTerm>("and"\<UnopTerm>)*
* UnopTerm := ("not")?\<CQLAtom>
* CQLAtom :=  \<CQLSingleAtom> | \<CQLListAtom> | "(" \<CQLTerm> ")"
* CQLSingleAtom := \<Field>\<CQL_STRING_OPERATORS>\"\<word>\"
* Field := "ancestor" | "creator" | "label" | "parent" | "space" | "title"
* CQL_STRING_OPERATORS := "=" | "!=" | "~" | "!\~"
* CQLListAtom := \<Field>\<CQL_List_Operators>\<list>
* list := "("\<list1>
* list1 := \<word> | \<word>\<restList>
* restList := ")" | ","\<list1>

