import {
    labelListNegQuery,
    labelListQuery,
    makeAndQuery,
    makeLabelQuery,
    makeListQuery,
    makeSimpleQuery,
    makeSpaceQuery,
    makeTitleQuery,
    multipleAndQuery,
    multipleAndQuery2,
    multipleChainAndQuery,
    multipleOrQuery,
    notQuery,
    precedenceQuery,
    precedenceQuery2,
    spaceQuery
} from "./testData";
import {Streams} from "@masala/parser";
import {parseCql} from "../src/cql/parser/parser";
import {InvalidQueryError} from "../src/cql/parser/error";
import {CQL_FIELDS, CQL_LIST_OPERATORS, CQL_STRING_OPERATORS} from "../src/cql/parser/constants";
import {listParser} from "../src/cql/parser/utility/helpers";
import {betweenBrackets, removeQuotes, sepByCommas} from "../src/cql/parser/utility/utility";

describe("CQL Parser", () => {

    describe ("CQL Atom Parser", () => {
        describe("Correct Syntax", () => {
            test("Can parse title query", () => {
                expect(parseCql("title ~ \"auto\"")).toEqual(makeTitleQuery("auto"));
            });

            test("Is case insensitive", () => {
                expect(parseCql("title ~ \"AUTO\"")).toEqual(makeTitleQuery("auto"));
            });

            test("Allow single quotes", () => {
                expect(parseCql( "title ~ 'auto'")).toEqual(makeTitleQuery("auto"));
            });

            test("allow Space in quotes", () => {
                expect(parseCql( "title ~ 'auto test'")).toEqual(makeTitleQuery("auto test"));
            });
            test("allow digits in quotes", () => {
                expect(parseCql( "title ~ 'auto123'")).toEqual(makeTitleQuery("auto123"));
            });

            test("allow special characters in quotes", () => {
                expect(parseCql( "title ~ 'auto&test$%-'")).toEqual(makeTitleQuery("auto&test$%-"));
            });

            test("No whitespace", () => {
                expect(parseCql("title~\"auto\"")).toEqual(makeTitleQuery("auto"));
            });

            test("Ignore extra whitespace at the end", () => {
                expect(parseCql("title ~ \"auto\"     ")).toEqual(makeTitleQuery("auto"));
            });

            test("Ignore extra whitespace at the start", () => {
                expect(parseCql("    title ~ \"auto\"")).toEqual(makeTitleQuery("auto"));
            });

            test("Allow no quotation marks", () => {
                expect(parseCql( "title ~ auto")).toEqual(makeTitleQuery("auto"));
            });

            test("Rejects empty string", () => {
                expect(() => parseCql("")).toThrowError(InvalidQueryError);
            });

            test("Consumes entire query", () => {
                expect(() => parseCql( "title ~ 'auto' dcdwcwed")).toThrowError(InvalidQueryError);
            });

            test("Can parse space query", () => {
                expect(parseCql("space = 'DEV'")).toEqual(spaceQuery);
            });

            test("Rejects nested quotes", () => {
                expect(() => parseCql("space = \"DEV\"123\"")).toThrowError(InvalidQueryError);
            });

            test("Allow mixed quotes", () => {
                expect(parseCql("title ~ \"tim's plan\"")).toEqual(makeTitleQuery("tim's plan"));
            });

            test("Can parse query with list with items wrapped in quotes", () => {
                expect(parseCql("label in (\"test\", \"dev\", \"abc\")")).toEqual(labelListQuery);
            });

            test("Can parse query with 'not in' as operator", () => {
                expect(parseCql("label not in (\"test\", \"dev\", \"abc\")")).toEqual(labelListNegQuery);
            });

            test("Can parse query with whitespace between 'not' and 'in' in 'not in' as operator", () => {
                expect(parseCql("label not    in (\"test\", \"dev\", \"abc\")")).toEqual(labelListNegQuery);
            });

            test("Can parse query with list with items not wrapped in quotes", () => {
                expect(parseCql("label in (test, dev, abc)")).toEqual(labelListQuery);
            });

            test("Can parse query with singleton list", () => {
                expect(parseCql("label in (test    )")).toEqual(makeLabelQuery(["test"]));
            });

            test("Ignores whitespace if not wrapped in quotes", () => {
                expect(parseCql("label in (test    , abc)")).toEqual(makeLabelQuery(["test", "abc"]));
            });

            test("Throws error if space character isn't wrapped in quotes", () => {
                expect(() => parseCql("label in (test dev, abc)")).toThrowError(InvalidQueryError);
            });

            test("Ignores brackets", () => {
                expect(parseCql("(title ~ \"auto\")")).toEqual(makeTitleQuery("auto"));
            });

            test("Ignores nested brackets", () => {
                expect(parseCql("((title ~ \"auto\"))")).toEqual(makeTitleQuery("auto"));
            });

            test("handle brackets with list", () => {
                expect(parseCql("(label in (\"test\", \"dev\", \"abc\"))")).toEqual(labelListQuery);
            });
        });

        describe("Correct Logic", () => {

            describe("operators", () => {
                test("~ with ancestor throws error", () => {
                    expect(() => parseCql("ancestor ~ '123'")).toThrowError(InvalidQueryError);
                });

                test("~ with creator throws error", () => {
                    expect(() => parseCql("creator ~ '123'")).toThrowError(InvalidQueryError);
                });

                test("~ with label throws error", () => {
                    expect(() => parseCql("label ~ '123'")).toThrowError(InvalidQueryError);
                });

                test("~ with parent throws error", () => {
                    expect(() => parseCql("parent ~ '123'")).toThrowError(InvalidQueryError);
                });

                test("~ with space throws error", () => {
                    expect(() => parseCql("space ~ '123'")).toThrowError(InvalidQueryError);
                });

                test("~ with type throws error", () => {
                    expect(() => parseCql("type ~ page")).toThrowError(InvalidQueryError);
                });

                test("'in' operator with parent throws error", () => {
                    expect(() => parseCql("parent in (123, 456)")).toThrowError(InvalidQueryError);
                });

                test("'not  in' operator with parent throws error", () => {
                    expect(() => parseCql("parent not in (123, 456)")).toThrowError(InvalidQueryError);
                });

                test("'in' operator with title throws error", () => {
                    expect(() => parseCql("title in (123, 456)")).toThrowError(InvalidQueryError);
                });

                test("'not in' operator with title throws error", () => {
                    expect(() => parseCql("title not in (123, 456)")).toThrowError(InvalidQueryError);
                });
            });

            describe("validation", () => {
                test("parent with only numbers is accepted", () => {
                    expect(parseCql("parent = '12345'")).toEqual(makeSimpleQuery(CQL_STRING_OPERATORS.EQUALS, "12345", CQL_FIELDS.PARENT));
                });

                test("Rejects parent that contains other characters", () => {
                    expect( () => parseCql("parent = '1234ABC'")).toThrowError(InvalidQueryError);
                });

                test("ancestor with only numbers is accepted", () => {
                    expect(parseCql("ancestor = '12345'")).toEqual(makeSimpleQuery(CQL_STRING_OPERATORS.EQUALS, "12345", CQL_FIELDS.ANCESTOR));
                });

                test("Rejects ancestor that contains other characters", () => {
                    expect( () => parseCql("ancestor = '1234ABC'")).toThrowError(InvalidQueryError);
                });

                test("Rejects invalid ancestor in list", () => {
                    expect( () => parseCql("ancestor in (1234,ABC)")).toThrowError(InvalidQueryError);
                });

                test("Accepts all valid ancestors", () => {
                    expect( parseCql("ancestor in (1234,567)")).toEqual(makeListQuery(CQL_LIST_OPERATORS.IN, ["1234","567"], CQL_FIELDS.ANCESTOR));
                });


                test("Reject creator if it's not alpha-numeric", () => {
                    expect(() => parseCql("creator = abc!@")) .toThrowError(InvalidQueryError);
                });

                test("Reject space if it's not alpha-numeric", () => {
                    expect(() => parseCql("space = abc!@")) .toThrowError(InvalidQueryError);
                });

                test("Accept space if it's alpha-numeric", () => {
                    expect(parseCql("space = abc")) .toEqual(makeSimpleQuery(CQL_STRING_OPERATORS.EQUALS, "abc", CQL_FIELDS.SPACE));
                });

                test("Rejects invalid space in list", () => {
                    expect( () => parseCql("ancestor in (abc!,def)")).toThrowError(InvalidQueryError);
                });

                test("Accepts all valid spaces", () => {
                    expect( parseCql("space in (abcd,efg)")).toEqual(makeListQuery(CQL_LIST_OPERATORS.IN, ["abcd","efg"], CQL_FIELDS.SPACE ));
                });
            });

            // space.key === space in cql
            test("space.key also works", () => {
                expect(parseCql("space.key = ABC")).toEqual(makeSimpleQuery(CQL_STRING_OPERATORS.EQUALS, "abc", CQL_FIELDS.SPACE));
            });

            describe("type field", () => {
                test("only allows certain constants", () => {
                    expect(parseCql("type = page")).toEqual(makeSimpleQuery(CQL_STRING_OPERATORS.EQUALS, "page", CQL_FIELDS.TYPE));
                    expect(parseCql("type = blogpost")).toEqual(makeSimpleQuery(CQL_STRING_OPERATORS.EQUALS, "blogpost", CQL_FIELDS.TYPE));
                    expect(parseCql("type = comment")).toEqual(makeSimpleQuery(CQL_STRING_OPERATORS.EQUALS, "comment", CQL_FIELDS.TYPE));
                    expect(parseCql("type = attachment")).toEqual(makeSimpleQuery(CQL_STRING_OPERATORS.EQUALS, "attachment", CQL_FIELDS.TYPE));
                });

                test("allows list operator", () => {
                    expect(parseCql("type IN (blogpost, page)")).toEqual(makeListQuery(CQL_LIST_OPERATORS.IN, ["blogpost","page"], CQL_FIELDS.TYPE));
                });

                test("rejects Invalid values", () => {
                    expect(() => parseCql("type = xyz")).toThrow(InvalidQueryError);
                });
            });


        });
    });

    describe ("CQL Unop Parser", () =>{
        test("can parse simple query", () => {
            expect(parseCql("NOT title ~ \"auto\"")).toEqual(notQuery);
        });

        test("can parse simple query with brackets", () => {
            expect(parseCql("NOT (title ~ \"auto\")")).toEqual(notQuery);
        });

        test("can parse simple query with brackets around everything", () => {
            expect(parseCql("(NOT title ~ \"auto\")")).toEqual(notQuery);
        });

        test("can parse simple query with 2 sets of brackets", () => {
            expect(parseCql("(NOT (title ~ \"auto\"))")).toEqual(notQuery);
        });
    });


    describe("CQL BinOp Parser", () => {
        test("Can join 2 queries together with AND", () => {
            expect(parseCql("title ~ \"auto\" AND space = 'DEV'"))
                .toEqual(multipleAndQuery);
        });

        test("Missing query on the right throws error", () => {
            expect(() => parseCql("title ~ \"auto\" AND "))
                .toThrowError(InvalidQueryError);
        });

        test("Invalid query on the right throws error", () => {
            expect(() => parseCql("title ~ \"auto\" AND space ~ 'DEV'"))
                .toThrowError(InvalidQueryError);
        });

        test("Can join 2 queries together with OR", () => {
            expect(parseCql("title ~ \"auto\" OR space = 'DEV'"))
                .toEqual(multipleOrQuery);
        });

        test("Can chain multiple ANDs with brackets", () => {
            expect(parseCql("label = 'test' AND (title ~ \"auto\" AND space = 'DEV')"))
                .toEqual(multipleChainAndQuery);
        });

        test("Can chain multiple ANDs without brackets", () => {
            expect(parseCql("label in ('test') AND title ~ \"auto\" AND space = 'DEV'"))
                .toEqual(makeAndQuery(
                    makeAndQuery(
                        makeLabelQuery(["test"]),
                        makeTitleQuery("auto")
                    ),
                    makeSpaceQuery("dev")
                ));
        });

        test("Ignores brackets", () => {
            expect(parseCql("(title ~ \"auto\") AND (space = 'DEV')")).toEqual(multipleAndQuery);
        });

        test("Test Associativity", () => {
            expect(parseCql("space = 'DEV' AND title ~ \"auto\"")).toEqual(multipleAndQuery2);
        });

        test("Correct precedence", () => {
            expect(parseCql("label = 'test' OR space = 'DEV' AND title ~ \"auto\"")).toEqual(precedenceQuery);
        });

        test("Correct precedence with brackets", () => {
            expect(parseCql("(label = 'test' OR space = 'DEV') AND title ~ \"auto\"")).toEqual(precedenceQuery2);
        });

        test("Correct precedence B", () => {
            expect(parseCql("title = process AND (label = xyz OR space = CS)")).toBeTruthy();
        });

        test("Correct precedence C", () => {
            expect(parseCql("(title = process AND label = xyz) OR space = CS")).toBeTruthy();
        });

        test("Correct precedence D", () => {
            expect(parseCql("(title = process AND label = xyz)")).toBeTruthy();
        });

    });

    describe("Errors thrown", () => {
        test("Invalid Parse throws error", () => {
            expect(() => parseCql("xyz")).toThrowError(InvalidQueryError);
        });

        test("correct symbols but wrong usage throws errror", () => {
            expect(() => parseCql("title > \"auto\"")).toThrowError(InvalidQueryError);
        });

        test("Rejects empty list", () => {
            expect( () => parseCql("label in ()")).toThrowError(InvalidQueryError);
        });

        test("Rejects label with invalid characters with equals", () => {
            expect( () => parseCql("label = 'ABC#'")).toThrowError(InvalidQueryError);
        });

        test("Rejects label with invalid characters in list", () => {
            expect( () => parseCql("label in (abc, ser.)")).toThrowError(InvalidQueryError);
        });

    });

});

describe("Generic Parsers", () => {
    test("Parses between brackets", () => {
        const parseResponse = betweenBrackets.parse(Streams.ofString("(a,b,c)"));
        expect(parseResponse.isAccepted()).toBe(true);
        expect(parseResponse.value).toBe("a,b,c");
    });

    describe("Sep by Commas", () => {
        test("separates values", () => {
            const parseResponse = sepByCommas.parse(Streams.ofString("a,b,c"));
            expect(parseResponse.isAccepted()).toBe(true);
            expect(parseResponse.value).toEqual(["a","b","c"]);
        });

        test("Ignores whitespace", () => {
            const parseResponse = sepByCommas.parse(Streams.ofString("a,  b, c"));
            expect(parseResponse.isAccepted()).toBe(true);
            expect(parseResponse.value).toEqual(["a","b","c"]);
        });

        test("rejects empty string", () => {
            const parseResponse = sepByCommas.parse(Streams.ofString(""));
            expect(parseResponse.isAccepted()).toBe(false);
        });

        test("accepts single value", () => {
            const parseResponse = sepByCommas.parse(Streams.ofString("abc"));
            expect(parseResponse.isAccepted()).toBe(true);
            expect(parseResponse.value).toEqual(["abc"]);
        });

        test("fails if incomplete", () => {
            const parseResponse = sepByCommas.parse(Streams.ofString("abc,"));
            expect(parseResponse.isAccepted()).toBe(false);
        });
        test("ignores double quotes", () => {
            const parseResponse = sepByCommas.parse(Streams.ofString("\"a\",\"b\",\"c\""));
            expect(parseResponse.isAccepted()).toBe(true);
            expect(parseResponse.value).toEqual(["a","b","c"]);
        });
    });

    describe("Remove Quotes",() => {
        test("works with double quotes", () => {
            expect(removeQuotes("\"abc\"")).toBe("abc");
        });

        test("works with single quotes", () => {
            expect(removeQuotes("'abc'")).toBe("abc");
        });

        test("doesn't change string", () => {
            expect(removeQuotes("abc")).toBe("abc");
        });

        test("allows nested quotes", () => {
            expect(removeQuotes("\"ab'c\"")).toBe("ab'c");
        });

    });

    test("get values between brackets" , () => {
        const parseResponse = listParser.parse(Streams.ofString("(a,b,c)"));
        expect(parseResponse.isAccepted()).toBe(true);
        expect(parseResponse.value).toBeTruthy();
        const items = parseResponse.value as string[];
        expect(items.sort()).toEqual(["a","b","c"]);
    });

});

