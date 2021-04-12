# CQL Parser
a parser for a subset of the [Confluence Query Language](https://developer.atlassian.com/cloud/confluence/advanced-searching-using-cql/)

## CQL Grammar

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
