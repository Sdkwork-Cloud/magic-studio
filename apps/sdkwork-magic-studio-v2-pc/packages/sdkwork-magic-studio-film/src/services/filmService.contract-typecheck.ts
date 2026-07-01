import type {
  MagicStudioApiEnvelope,
  MagicStudioApiListEnvelope,
  MagicStudioFilmAnalysisRequest,
  MagicStudioServerClient,
} from '@sdkwork/magic-studio-server';
import type {
  FilmCharacter,
  FilmProp,
  FilmScriptAnalysisResult,
} from '@sdkwork/magic-studio-types/film';

type AssertAssignable<T extends U, U> = true;

type RuntimeAnalysisRequest =
  Parameters<MagicStudioServerClient['analyzeFilmScript']>[0];
type RuntimeAnalysisEnvelope = Awaited<
  ReturnType<MagicStudioServerClient['analyzeFilmScript']>
>;
type RuntimeCharacterExtractionRequest =
  Parameters<MagicStudioServerClient['extractFilmCharacters']>[0];
type RuntimeCharacterExtractionList = Awaited<
  ReturnType<MagicStudioServerClient['extractFilmCharacters']>
>;
type RuntimePropExtractionRequest =
  Parameters<MagicStudioServerClient['extractFilmProps']>[0];
type RuntimePropExtractionList = Awaited<
  ReturnType<MagicStudioServerClient['extractFilmProps']>
>;

const runtimeAnalysisRequestMatchesServerType: AssertAssignable<
  RuntimeAnalysisRequest,
  MagicStudioFilmAnalysisRequest
> = true;
const serverAnalysisRequestMatchesRuntimeType: AssertAssignable<
  MagicStudioFilmAnalysisRequest,
  RuntimeAnalysisRequest
> = true;
const runtimeAnalysisEnvelopeMatchesServerType: AssertAssignable<
  RuntimeAnalysisEnvelope,
  MagicStudioApiEnvelope<FilmScriptAnalysisResult>
> = true;
const runtimeCharacterExtractionRequestMatchesServerType: AssertAssignable<
  RuntimeCharacterExtractionRequest,
  MagicStudioFilmAnalysisRequest
> = true;
const runtimeCharacterExtractionListMatchesServerType: AssertAssignable<
  RuntimeCharacterExtractionList,
  MagicStudioApiListEnvelope<FilmCharacter>
> = true;
const runtimePropExtractionRequestMatchesServerType: AssertAssignable<
  RuntimePropExtractionRequest,
  MagicStudioFilmAnalysisRequest
> = true;
const runtimePropExtractionListMatchesServerType: AssertAssignable<
  RuntimePropExtractionList,
  MagicStudioApiListEnvelope<FilmProp>
> = true;

const validFilmAnalysisRequest = {
  content: 'INT. SHANGHAI ALLEY - NIGHT',
  language: 'zh-CN',
} satisfies RuntimeAnalysisRequest;

const validFilmCharacter = {
  id: 'character-1',
  uuid: 'character-1',
  createdAt: 1,
  updatedAt: 1,
  type: 'FILM_CHARACTER',
  name: 'Lin',
  characterType: 'HUMAN',
  refAssets: [],
  description: 'A determined detective',
  status: 'ACTIVE',
} satisfies FilmCharacter;

const validFilmProp = {
  id: 'prop-1',
  uuid: 'prop-1',
  createdAt: 1,
  updatedAt: 1,
  type: 'FILM_PROP',
  name: 'Silver lighter',
  description: 'An engraved lighter',
  tags: ['plot-device'],
  refAssets: [],
} satisfies FilmProp;

const validFilmScriptAnalysisResult = {
  characters: [validFilmCharacter],
  locations: [],
  props: [validFilmProp],
  scenes: [],
  shots: [],
} satisfies FilmScriptAnalysisResult;

const validFilmAnalysisResponse = {
  requestId: 'request-film-analysis',
  timestamp: '2026-04-25T00:00:00.000Z',
  data: validFilmScriptAnalysisResult,
  meta: {
    version: '2026-04-25',
  },
} satisfies RuntimeAnalysisEnvelope;

const validFilmCharacterExtractionResponse = {
  requestId: 'request-film-characters',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validFilmCharacter],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimeCharacterExtractionList;

const validFilmPropExtractionResponse = {
  requestId: 'request-film-props',
  timestamp: '2026-04-25T00:00:00.000Z',
  items: [validFilmProp],
  meta: {
    page: 1,
    pageSize: 20,
    total: 1,
    version: '2026-04-25',
  },
} satisfies RuntimePropExtractionList;

void runtimeAnalysisRequestMatchesServerType;
void serverAnalysisRequestMatchesRuntimeType;
void runtimeAnalysisEnvelopeMatchesServerType;
void runtimeCharacterExtractionRequestMatchesServerType;
void runtimeCharacterExtractionListMatchesServerType;
void runtimePropExtractionRequestMatchesServerType;
void runtimePropExtractionListMatchesServerType;
void validFilmAnalysisRequest;
void validFilmAnalysisResponse;
void validFilmCharacterExtractionResponse;
void validFilmPropExtractionResponse;
