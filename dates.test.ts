import Analyser from "./parser.ts";

enum CharacterGroup {
  Number,
  Separator,
  Other,
}

enum DateToken {
  Day,
  Month,
  Year,
  YMSeparator,
  MDSeparator,
  //End
}

var analyser = Analyser();
var configuredAnalyser = analyser.setClassifier((char: string) => {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => i.toString()).includes(char)
    ? CharacterGroup.Number
    : ["-", "/", "."].includes(char)
    ? CharacterGroup.Separator
    : CharacterGroup.Other;
});

const analysis = configuredAnalyser

  .whenTokenIs(DateToken.Year)
  .fromAnyOf(CharacterGroup.Number)
  .toAnyOf(CharacterGroup.Number)
  .setsToken(DateToken.Year)
  .fromAnyOf(CharacterGroup.Number)
  .toAnyOf(CharacterGroup.Separator)
  .setsToken(DateToken.YMSeparator)

  .whenTokenIs(DateToken.YMSeparator)
  .fromAnyOf(CharacterGroup.Separator)
  .toAnyOf(CharacterGroup.Number)
  .setsToken(DateToken.Month)

  .whenTokenIs(DateToken.Month)
  .fromAnyOf(CharacterGroup.Number)
  .toAnyOf(CharacterGroup.Number)
  .setsToken(DateToken.Month)
  .fromAnyOf(CharacterGroup.Number)
  .toAnyOf(CharacterGroup.Separator)
  .setsToken(DateToken.MDSeparator)

  .whenTokenIs(DateToken.MDSeparator)
  .fromAnyOf(CharacterGroup.Separator)
  .toAnyOf(CharacterGroup.Number)
  .setsToken(DateToken.Day)

  .whenTokenIs(DateToken.Day)
  .fromAnyOf(CharacterGroup.Number)
  .toAnyOf(CharacterGroup.Number)
  .setsToken(DateToken.Day)

  .analyse("2020-01-01", DateToken.Year);

console.log(analysis);
