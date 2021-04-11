type AnyEnum = string | number;

// function getText(enumMember: AnyEnum, allMembers: any) {
//   if (typeof enumMember === 'string') return enumMember;
//   if (typeof enumMember === 'number') return allMembers[enumMember];
//   return "";
// }

interface TAStage0<TToken extends AnyEnum, TGroup extends AnyEnum> {
  /** Sets a classifier function which is used to map each character to a TGroup */
  setClassifier: (
    classifier: (character: string) => TGroup
  ) => TAStage1<TToken, TGroup>;
}

interface TAStage1<TToken extends AnyEnum, TGroup extends AnyEnum> {
  /**
   * Begins a block of transitions by specifying which token
   * they apply to
   */
  whenTokenIs: (token: TToken) => TAStage2<TToken, TGroup>;
}

interface TAStage2<TToken extends AnyEnum, TGroup extends AnyEnum> {
  /**
   * Begins the definition of a transition by specifying
   * a 'before' set of character groups that this transition applies to
   */
  fromAnyOf: (group: TGroup, ...args: TGroup[]) => TAStage3<TToken, TGroup>;
}

interface TAStage3<TToken extends AnyEnum, TGroup extends AnyEnum> {
  /**
   * Continues the definition of a transition by specifying
   * an 'after' set of character groups that this transition applies to
   */
  toAnyOf: (group: TGroup, ...args: TGroup[]) => TAStage4<TToken, TGroup>;
}

interface TAStage4<TToken extends AnyEnum, TGroup extends AnyEnum> {
  /**
   * Completes the definition of a transition by specifying the
   * which token results from this transition
   */
  setsToken: (token: TToken) => TAStage5<TToken, TGroup>;
}

interface TAStage5<TToken extends AnyEnum, TGroup extends AnyEnum> {
  /**
   * Begins a block of transitions by specifying which token
   * they apply to
   */
  whenTokenIs: (token: TToken) => TAStage2<TToken, TGroup>;
  /**
   * Begins the definition of a transition by specifying
   * a 'before' set of character groups that this transition applies to
   */
  fromAnyOf: (group: TGroup, ...args: TGroup[]) => TAStage3<TToken, TGroup>;
  /**
   * Performs analysis on the provided string based on the specified transitions,
   * assuming that the first token is of the type specified
   */
  analyse: (value: string, startingToken: TToken) => ParsedToken<TToken>[];
}

type Transition<TToken extends AnyEnum, TGroup extends AnyEnum> = {
  currentToken: TToken;
  from: TGroup[];
  to: TGroup[];
  newToken?: TToken;
};

export type ParsedToken<TToken extends AnyEnum> = {
  type: TToken;
  value: string;
};

/** Creates and returns new instance of TokenAnalyser from which chained methods can be called for configuration */
export default function TokenAnalyser<
  TToken extends AnyEnum,
  TGroup extends AnyEnum
>() {
  const NullTerminator = Symbol();
  const Terminator = Symbol();

  /** A class which can be configured to break a string into tokens by configuring state-machine rules */
  class TokenAnalyser
    implements
      TAStage1<TToken, TGroup>,
      TAStage2<TToken, TGroup>,
      TAStage3<TToken, TGroup>,
      TAStage4<TToken, TGroup>,
      TAStage5<TToken, TGroup> {
    /**
     * This static method is called when the enclosing function is called, returning a
     * new instance of TokenAnalyster
     * */
    static start(): TAStage0<TToken, TGroup> {
      return new TokenAnalyser();
    }

    // For maintaining internal state
    private currentKey: TToken | undefined;
    private currentTransition: Transition<TToken, TGroup> | undefined;

    /**
     * This function is called by each successive character to classify it.
     * This is set when setClassifer(...) is called on the TokenAnalyser instance
     */
    private getGroup:
      | ((character: string) => TGroup | typeof NullTerminator)
      | undefined;

    /** An accumulated object of potential transitions which define tokens */
    private validTransitions: {
      [key in TToken]?: Transition<TToken, TGroup>[];
    } = {};

    /** The resulting array of tokens, produced as a result of a call to analyse(...) */
    private parsedTokens: ParsedToken<TToken>[] = [];

    private static BUILDER_ERROR =
      "Builder error: whenTokenIs must be called before any subsequent chained calls!";

    /**
     * Updates the currentKey property and adds a new transition to validTranisitions, based on a whenTokenIs call
     * This will subsequently be configured via a sequence of fromAnyOf-toAnyOf-setsToken calls
     */
    private startNewTransition() {
      // this.currentKey will have been set by a call to whenTokenIs
      if (this.currentKey === undefined) {
        throw Error(TokenAnalyser.BUILDER_ERROR);
      }
      // this.validTransitions[this.currentKey] will have been initialised to an array
      this.validTransitions[this.currentKey]?.push({
        currentToken: this.currentKey,
        from: [],
        to: [],
      });
      // Set this.currentTransition to point to the newly created transition object
      this.currentTransition = ((prop) => prop[prop.length - 1])(
        this.validTransitions[this.currentKey]!
      );
      return this.currentTransition;
    }

    setClassifier(classifier: (character: string) => TGroup) {
      // Combine the passed in classifier with a check for the end of the string
      this.getGroup = (character: string) =>
        character === "\0" ? NullTerminator : classifier(character);
      return this;
    }

    whenTokenIs(token: TToken) {
      console.debug(`whenTokenIs(${token})`);
      this.currentKey = token;
      if (!this.validTransitions[token])
        this.validTransitions[this.currentKey] = [];
      return this;
    }

    fromAnyOf(group: TGroup, ...args: TGroup[]) {
      console.debug(`fromAnyOf(${[group, ...args]})`);
      if (this.currentKey === undefined) {
        throw Error(TokenAnalyser.BUILDER_ERROR);
      }

      this.startNewTransition().from = [group, ...args];
      return this;
    }

    toAnyOf(group: TGroup, ...args: TGroup[]) {
      console.debug(`toAnyOf(${[group, ...args]})`);
      if (
        this.currentKey === undefined ||
        this.currentTransition === undefined ||
        this.currentTransition.from === []
      ) {
        throw Error(TokenAnalyser.BUILDER_ERROR);
      }
      this.currentTransition.to = [group, ...args];
      return this;
    }

    setsToken(token: TToken) {
      console.debug(`setsToken(${token})`);
      if (
        this.currentKey === undefined ||
        this.currentTransition === undefined ||
        this.currentTransition.from === [] ||
        this.currentTransition.to === []
      ) {
        throw Error(TokenAnalyser.BUILDER_ERROR);
      }
      this.currentTransition.newToken = token;
      return this;
    }

    // terminates() {
    //   this.setsToken(NullTerminator)
    // }

    analyse(value: string, startingToken: TToken): ParsedToken<TToken>[] {
      let currentToken = startingToken;
      // TODO: Enhancement: Pass a function that will evaluate the first token

      /** This variable holds the token group of the current character */
      let currentGroup = this.getGroup!(value.charAt(0)) as TGroup;
      /** This variable holds the running value of the current token */
      let runningValue = value.charAt(0);

      // Trim the first character and add a null terminator so we know when to finish
      // Loop through each character:

      for (let nextCharacter of value.trim().slice(1) + "\0") {
        // Record what token group the current and next characters are from
        const transition: [TGroup, TGroup | typeof NullTerminator] = [
          currentGroup,
          this.getGroup!(nextCharacter),
        ];

        const storeCurrentToken = (() => {
          //console.log((typeof TToken)[currentToken])
          this.parsedTokens.push({
            type: currentToken,
            value: runningValue,
          });
          runningValue = "";
        }).bind(this);

        if (transition[1] === NullTerminator) {
          storeCurrentToken();
          break;
        }

        const oldGroup: TGroup = transition[0];
        const newGroup: TGroup = transition[1];

        // Search all valid transitions for a match
        const candidates: Transition<TToken, TGroup>[] =
          this.validTransitions[currentToken] ?? []; // TODO: Deal with undefined
        const result = candidates?.filter(
          (c) => c.from.includes(oldGroup) && c.to.includes(newGroup)
        )[0];

        // Throw if an invalid transition
        if (!result) {
          throw Error(
            "Illegal transition " +
              JSON.stringify(transition) +
              " when parsing " +
              currentToken
          );
        }

        // If the transition is to a DIFFERENT token, the previous one is complete
        // and should be added to the results, and the running value reset.
        if (currentToken !== result.newToken) {
          storeCurrentToken();
        }

        // Advance to the next character for the next loop
        runningValue += nextCharacter;
        currentToken = result.newToken!;
        currentGroup = newGroup;
      }

      // Return all of the parsed tokens
      return this.parsedTokens;
    }
  }

  return TokenAnalyser.start();
}
