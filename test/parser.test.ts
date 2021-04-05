import { listParser, parseCql } from "../src/cql/parser/parser";
import { InvalidQueryError } from "../src/cql/parser/error";
import { spaceQuery, labelListQuery, multQuery, multQuery2, precedenceQuery, precedenceQuery2, makeTitleQuery, makeLabelQuery, notQuery } from "./testData";
import { betweenBrackets, removeQuotes, sepByCommas } from "../src/cql/parser/utility";
import { Streams } from "@masala/parser";

describe("CQL Parser", () => {

    describe ("CQL Atom Parser", () => {
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
    
        test("Forces quotation marks", () => {
            expect(() => parseCql( "title ~ auto")).toThrowError(InvalidQueryError);
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
    
        test("Can parse query with list with items not wrapped in quotes", () => {
            expect(parseCql("label in (test, dev, abc)")).toEqual(labelListQuery);
        });

        test("Can parse query with singleton list", () => {
            expect(parseCql("label in (test)")).toEqual(makeLabelQuery(["test"]));
        });

        test("Ignores brackets", () => {
            expect(parseCql("(title ~ \"auto\")")).toEqual(makeTitleQuery("auto"));
        });

        // TODO handle nested brackets
        test("Ignores nested brackets", () => {
            expect(parseCql("((title ~ \"auto\"))")).toEqual(makeTitleQuery("auto"));
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
    
        test("Correct precedence", () => {
            expect(parseCql("label = 'test' OR space = 'DEV' AND title ~ \"auto\"")).toEqual(precedenceQuery);
        });
    
        test("Correct precedence with brackets", () => {
            expect(parseCql("(label = 'test' OR space = 'DEV') AND title ~ \"auto\"")).toEqual(precedenceQuery2);
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
            console.log(parseCql("label in ()"));
            expect( () => parseCql("label in ()")).toThrowError(InvalidQueryError);
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
        test("works", () => {
            expect(removeQuotes("\"abc\"")).toBe("abc");
        });
    
        test("doesn't change string", () => {
            expect(removeQuotes("abc")).toBe("abc");
        });

        test("allows nested quotes", () => {
            expect(removeQuotes("\"ab'c\"")).toBe("ab'c");
        });

        // test("allows nested quotes", () => {
        //     expect(removeQuotes("ab\"c")).toBe("ab\"c");
        // });

    });

    test("get values between brackets" , () => {
        const parseResponse = listParser.parse(Streams.ofString("(a,b,c)"));
        expect(parseResponse.isAccepted()).toBe(true);
        expect(parseResponse.value.sort()).toEqual(["a","b","c"]);
    });
   
});

