import { TokenAnalyser } from "./parser.ts";
import { assertEquals } from "https://deno.land/std@0.101.0/testing/asserts.ts";

const { test } = Deno;

export enum Token {
  Type1 = "type",
  TypeSep = "type-separator",
  Type2 = "subtype",
  WS1 = "post-subtype-whitespace",
  BeginParam = "parameter-separator",
  WS2 = "pre-parameter-whitespace",
  Name = "parameter-name",
  Equals = "name-value-separator",
  OpenQuote = "value-open-quote",
  Value = "unquoted-parameter-value",
  QuotedValue = "quoted-parameter-value",
  CloseQuote = "value-close-quote",
  Terminator = "terminator",
}

export enum Group {
  Unrecognised = "unrecognised",

  // tspecials with particular significance
  Quote = "quote",
  Equals = "equals",
  Semicolon = "semicolon",
  ForwardSlash = "forwardslash",

  // TODO: other tspecials
  // OpenParenthesis = 'openparenthesis',
  // CloseParenthesis = 'closeparenthesis',
  // LessThan = 'lessthan',
  // GreaterThan = 'greaterthan',
  // At = 'at',
  // Comma = 'comma',
  // Colon = 'colon',
  // BackSlash = 'backslash',
  // OpenBracket = 'openbracket',
  // CloseBracket = 'closebracket',
  // QuestionMark = 'questionmark',
  // Dot = 'dot',

  // tokens
  Letter = "letter",
  Numeral = "numeral",
  Hyphen = "hyphen",
  OtherSymbol = "symbol",

  Whitespace = "whitespace",
  Null = "null",
}

var analyser = TokenAnalyser();
var configuredAnalyser = analyser.setClassifier((character: string) => {
  const char = character.charAt(0);
  if (char === "\0") return Group.Null;
  if (/^-$/.test(char)) return Group.Hyphen;
  if (/^"$/.test(char)) return Group.Quote;
  if (/^=$/.test(char)) return Group.Equals;
  if (/^;$/.test(char)) return Group.Semicolon;
  if (/^\s$/.test(char)) return Group.Whitespace;
  if (/^\/$/.test(char)) return Group.ForwardSlash;
  if (/^[a-zA-Z]$/.test(char)) return Group.Letter;
  if (/^[0-9]$/.test(char)) return Group.Numeral;
  return Group.OtherSymbol;
});

test({
  name: "content-type",
  ignore: false,
  fn: () => {
    const result = configuredAnalyser
      .whenTokenIs(Token.Type1)
      .fromAnyOf(Group.Letter, Group.Hyphen).toAnyOf(Group.Letter, Group.Hyphen)
      .setsToken(Token.Type1)
      .fromAnyOf(Group.Letter).toAnyOf(Group.ForwardSlash).setsToken(
        Token.TypeSep,
      )
      .whenTokenIs(Token.TypeSep)
      .fromAnyOf(Group.ForwardSlash).toAnyOf(Group.Letter).setsToken(
        Token.Type2,
      )
      .whenTokenIs(Token.Type2)
      .fromAnyOf(Group.Letter, Group.Hyphen).toAnyOf(Group.Letter, Group.Hyphen)
      .setsToken(Token.Type2)
      .fromAnyOf(Group.Letter).toAnyOf(Group.Whitespace).setsToken(Token.WS1)
      .fromAnyOf(Group.Letter).toAnyOf(Group.Semicolon).setsToken(
        Token.BeginParam,
      )
      .fromAnyOf(Group.Letter).toAnyOf(Group.Null).setsToken(Token.Terminator)

      .analyse("multipart/related", Token.Type1);

    assertEquals(result.length, 3);
    assertEquals(result[0], { type: "type", value: "multipart" });
    assertEquals(result[1], { type: "type-separator", value: "/" });
    assertEquals(result[2], { type: "subtype", value: "related" });
  },
});
