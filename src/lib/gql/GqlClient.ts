import { envParseString } from '#lib/env';
import { getAbility, getFlavorTexts, getItem, getLearnset, getMove, getPokemon, getPokemonSprites, getTypeMatchup } from '#lib/gql/queries';
import { RedisKeys } from '#lib/redis-cache/RedisCacheClient';
import { pokemonEnumToSpecies } from '#utils/functions/pokemonParsers';
import { hideLinkEmbed, inlineCode } from '@discordjs/builders';
import type {
  AbilitiesEnum,
  ItemsEnum,
  MovesEnum,
  PokemonEnum,
  Query,
  QueryGetAbilityArgs,
  QueryGetItemArgs,
  QueryGetLearnsetArgs,
  QueryGetMoveArgs,
  QueryGetPokemonArgs,
  QueryGetTypeMatchupArgs,
  TypesEnum
} from '@favware/graphql-pokemon';
import { fetch, FetchMethods, FetchResultTypes } from '@sapphire/fetch';
import { container, fromAsync, isErr, UserError } from '@sapphire/framework';
import { toTitleCase } from '@sapphire/utilities';
import os from 'node:os';

export class GqlClient {
  #uri = envParseString('POKEMON_API_URL');

  #userAgent = `Favware Dragonite/1.0.0 (apollo-client) ${os.platform()}/${os.release()}`;

  public async getAbility(ability: AbilitiesEnum) {
    const result = await fromAsync(async () => {
      const abilityFromCache = await container.gqlRedisCache.fetch<RedisKeys.GetAbility>(RedisKeys.GetAbility, ability);
      if (abilityFromCache) return abilityFromCache;

      const apiResult = await this.fetchGraphQLPokemon<'getAbility'>(getAbility, { ability });
      return apiResult.data.getAbility;
    });

    if (isErr(result)) {
      return this.error('AbilityQueryFail', `I am sorry, but that query failed. Are you sure ${ability} is actually an ability in Pokémon?`);
    }

    await container.gqlRedisCache.insert<RedisKeys.GetAbility>(
      RedisKeys.GetAbility, //
      ability,
      result.value
    );

    return result.value;
  }

  public async getItem(item: ItemsEnum) {
    const result = await fromAsync(async () => {
      const itemFromCache = await container.gqlRedisCache.fetch<RedisKeys.GetItem>(RedisKeys.GetItem, item);
      if (itemFromCache) return itemFromCache;

      const apiResult = await this.fetchGraphQLPokemon<'getItem'>(getItem, { item });
      return apiResult.data.getItem;
    });

    if (isErr(result)) {
      return this.error('ItemQueryFail', `I am sorry, but that query failed. Are you sure ${item} is actually an item in Pokémon?`);
    }

    await container.gqlRedisCache.insert<RedisKeys.GetItem>(
      RedisKeys.GetItem, //
      item,
      result.value
    );

    return result.value;
  }

  public async getMove(move: MovesEnum) {
    const result = await fromAsync(async () => {
      const moveFromCache = await container.gqlRedisCache.fetch<RedisKeys.GetMove>(RedisKeys.GetMove, move);
      if (moveFromCache) return moveFromCache;

      const apiResult = await this.fetchGraphQLPokemon<'getMove'>(getMove, { move });
      return apiResult.data.getMove;
    });

    if (isErr(result)) {
      return this.error('MoveQueryFail', `I am sorry, but that query failed. Are you sure ${move} is actually a move in Pokémon?`);
    }

    await container.gqlRedisCache.insert<RedisKeys.GetMove>(
      RedisKeys.GetMove, //
      move,
      result.value
    );

    return result.value;
  }

  public async getFlavors(pokemon: PokemonEnum) {
    const result = await fromAsync(async () => {
      const pokemonFromCache = await container.gqlRedisCache.fetch<RedisKeys.GetFlavors>(RedisKeys.GetFlavors, pokemon);
      if (pokemonFromCache) return pokemonFromCache;

      const apiResult = await this.fetchGraphQLPokemon<'getPokemon'>(getFlavorTexts, { pokemon });
      return apiResult.data.getPokemon;
    });

    if (isErr(result)) {
      return this.error(
        'FlavorQueryFail',
        `I am sorry, but that query failed. Are you sure ${inlineCode(pokemonEnumToSpecies(pokemon))} is actually a Pokémon?`
      );
    }

    await container.gqlRedisCache.insert<RedisKeys.GetFlavors>(
      RedisKeys.GetFlavors, //
      pokemon,
      result.value
    );

    return result.value;
  }

  public async getPokemon(pokemon: PokemonEnum) {
    const result = await fromAsync(async () => {
      const pokemonFromCache = await container.gqlRedisCache.fetch<RedisKeys.GetPokemon>(RedisKeys.GetPokemon, pokemon);
      if (pokemonFromCache) return pokemonFromCache;

      const apiResult = await this.fetchGraphQLPokemon<'getPokemon'>(getPokemon, { pokemon });
      return apiResult.data.getPokemon;
    });

    if (isErr(result)) {
      return this.error(
        'PokemonQueryFail',
        `I am sorry, but that query failed. Are you sure ${inlineCode(pokemonEnumToSpecies(pokemon))} is actually a Pokémon?`
      );
    }

    await container.gqlRedisCache.insert<RedisKeys.GetPokemon>(
      RedisKeys.GetPokemon, //
      pokemon,
      result.value
    );

    return result.value;
  }

  public async getSprites(pokemon: PokemonEnum) {
    const result = await fromAsync(async () => {
      const pokemonFromCache = await container.gqlRedisCache.fetch<RedisKeys.GetSprites>(RedisKeys.GetSprites, pokemon);
      if (pokemonFromCache) return pokemonFromCache;

      const apiResult = await this.fetchGraphQLPokemon<'getPokemon'>(getPokemonSprites, { pokemon });
      return apiResult.data.getPokemon;
    });

    if (isErr(result)) {
      return this.error(
        'SpriteQueryFail',
        `I am sorry, but that query failed. Are you sure ${inlineCode(pokemonEnumToSpecies(pokemon))} is actually a Pokémon?`
      );
    }

    await container.gqlRedisCache.insert<RedisKeys.GetSprites>(
      RedisKeys.GetSprites, //
      pokemon,
      result.value
    );

    return result.value;
  }

  public async getLearnset(pokemon: PokemonEnum, moves: MovesEnum[], generation = 8) {
    const result = await fromAsync(async () => {
      const learnsetFromCache = await container.gqlRedisCache.fetch<RedisKeys.GetLearnset>(
        RedisKeys.GetLearnset,
        `${pokemon}|${generation}|${moves.join(',')}`
      );
      if (learnsetFromCache) return learnsetFromCache;

      const apiResult = await this.fetchGraphQLPokemon<'getLearnset'>(getLearnset, { pokemon, moves, generation });
      return apiResult.data.getLearnset;
    });

    if (isErr(result)) {
      return this.error(
        'LearnsetQueryFail',
        `I am sorry, but that query failed. Are you sure you ${inlineCode(
          pokemonEnumToSpecies(pokemon)
        )} is actually a Pokémon and ${container.i18n.listAnd.format(moves)} are actually moves?`
      );
    }

    await container.gqlRedisCache.insert<RedisKeys.GetLearnset>(
      RedisKeys.GetLearnset, //
      `${pokemon}|${generation}|${moves.join(',')}`,
      result.value
    );

    return result.value;
  }

  public async getTypeMatchup(types: TypesEnum[]) {
    const result = await fromAsync(async () => {
      const typeMatchupFromCache = await container.gqlRedisCache.fetch<RedisKeys.GetTypeMatchup>(
        RedisKeys.GetTypeMatchup,
        types.length === 1 ? types[0] : `${types[0]},${types[1]}`
      );
      if (typeMatchupFromCache) return typeMatchupFromCache;

      const apiResult = await this.fetchGraphQLPokemon<'getTypeMatchup'>(getTypeMatchup, { types });

      return apiResult.data.getTypeMatchup;
    });

    if (isErr(result)) {
      const typesMappedWithInlineCode = types.map((type) => inlineCode(toTitleCase(type)));

      return this.error(
        'LearnsetQueryFail',
        `I am sorry, but that query failed. Are you sure ${container.i18n.listAnd.format(typesMappedWithInlineCode)} are actually types in Pokémon?`
      );
    }

    await container.gqlRedisCache.insert<RedisKeys.GetTypeMatchup>(
      RedisKeys.GetTypeMatchup, //
      types.length === 1 ? types[0] : `${types[0]},${types[1]}`,
      result.value
    );

    return result.value;
  }

  /**
   * Throws a new {@link UserError} that will be send to the user as ephemeral message
   * @param identifier The identifier to throw
   * @param message The message to send to the user
   */
  private error(identifier: string, message: string) {
    throw new UserError({ identifier, message });
  }

  private async fetchGraphQLPokemon<R extends PokemonQueryReturnTypes>(
    query: string,
    variables: PokemonQueryVariables<R>
  ): Promise<PokemonResponse<R>> {
    const result = await fromAsync(async () =>
      fetch<PokemonResponse<R>>(
        this.#uri,
        {
          method: FetchMethods.Post,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': this.#userAgent
          },
          body: JSON.stringify({
            query,
            variables
          })
        },
        FetchResultTypes.JSON
      )
    );

    if (isErr(result)) {
      throw new UserError({
        identifier: 'QueryFail',
        message: `Oh dear, I failed to get data about that query. Please try again. If the issue keeps showing up, you can get in touch with the developers by joining my support server through ${hideLinkEmbed(
          'https://join.favware.tech'
        )}`
      });
    }

    return result.value;
  }
}

export namespace DragoniteGqlClient {
  export type Response<K extends keyof Omit<Query, '__typename'>> = PokemonResponse<K>;
  export type QueryReturnTypes = PokemonQueryReturnTypes;
}

interface PokemonResponse<K extends keyof Omit<Query, '__typename'>> {
  data: Record<K, Omit<Query[K], '__typename'>>;
}

type PokemonQueryReturnTypes = keyof Pick<Query, 'getAbility' | 'getItem' | 'getMove' | 'getPokemon' | 'getLearnset' | 'getTypeMatchup'>;

type PokemonQueryVariables<R extends PokemonQueryReturnTypes> = R extends 'getAbility'
  ? QueryGetAbilityArgs
  : R extends 'getItem'
  ? QueryGetItemArgs
  : R extends 'getMove'
  ? QueryGetMoveArgs
  : R extends 'getPokemon'
  ? QueryGetPokemonArgs
  : R extends 'getLearnset'
  ? QueryGetLearnsetArgs
  : R extends 'getTypeMatchup'
  ? QueryGetTypeMatchupArgs
  : never;
