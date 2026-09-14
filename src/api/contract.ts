// Does this app's idea of the API match the API's own?
//
// types.ts is written by hand, and it should be: a curated type with a sentence
// about why a field is nullable reads better than anything generated. What it
// could not do until now is keep its promise — the header there claims a drift
// "shows up as a type error the first time a screen touches the field", and
// nothing made that true, because nothing connected the file to the server.
//
// This does. schema.d.ts is generated from Backend/docs/openapi.json, which is
// generated from the server's own types, and every line below asserts that one
// of ours is exactly one of theirs — both directions, so a field added on
// either side is a failure. There is no runtime here: `npm run typecheck` is
// the test.

import type { components, paths } from './schema'
import type {
  CaseImportSource,
  AccountStatus,
  AttributeNameCount,
  Brand,
  BrandPage,
  Capability,
  CardPhoto,
  CaseListItem,
  CasePage,
  CategoryCount,
  CutoutMethod,
  CutoutMethodSettings,
  CutoutPreview,
  CutoutPreviewResponse,
  CutoutSettings,
  ImportSource,
  LabelListItem,
  LabelPage,
  LabelSlot,
  LibraryPhoto,
  ManagedUser,
  Manual,
  ManualLibraryPage,
  Organizer,
  OrganizerLabel,
  OrganizerPage,
  OrganizerTool,
  Photo,
  PhotoLibraryPage,
  PhotoOwner,
  PhotoOwnerKind,
  PhotoOwnerRef,
  PhotoSearchResult,
  PhotoSource,
  PhotoSuggestion,
  Role,
  SearchEngineSettings,
  SearchProvider,
  Session,
  SuggestionProvider,
  SystemCount,
  ToolAttribute,
  ToolCase,
  ToolCondition,
  ToolDetail,
  ToolImportResult,
  ToolListItem,
  ToolPage,
  ToolPlacement,
  User,
} from './types'

type Schemas = components['schemas']

// Mutual assignability. `[A] extends [B]` rather than `A extends B` so a union
// is compared as a whole rather than distributed over its members.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false

type Assert<T extends true> = T

export type _AccountStatus = Assert<Same<AccountStatus, Schemas['AccountStatus']>>
export type _AttributeNameCount = Assert<Same<AttributeNameCount, Schemas['AttributeNameCount']>>
export type _Brand = Assert<Same<Brand, Schemas['Brand']>>
export type _BrandPage = Assert<Same<BrandPage, Schemas['BrandPage']>>
export type _Capability = Assert<Same<Capability, Schemas['Capability']>>
export type _CardPhoto = Assert<Same<CardPhoto, Schemas['CardPhoto']>>
export type _CaseListItem = Assert<Same<CaseListItem, Schemas['CaseListItem']>>
export type _CasePage = Assert<Same<CasePage, Schemas['CaseListPage']>>
export type _CategoryCount = Assert<Same<CategoryCount, Schemas['CategoryCount']>>
export type _CutoutMethod = Assert<Same<CutoutMethod, Schemas['CutoutMethod']>>
export type _CutoutMethodSettings = Assert<
  Same<CutoutMethodSettings, Schemas['CutoutMethodSettings']>
>
export type _CutoutPreview = Assert<Same<CutoutPreview, Schemas['CutoutPreview']>>
export type _CutoutPreviewResponse = Assert<
  Same<CutoutPreviewResponse, Schemas['CutoutPreviewResponse']>
>
export type _CutoutSettings = Assert<Same<CutoutSettings, Schemas['CutoutSettings']>>
export type _ImportSource = Assert<Same<ImportSource, Schemas['ImportSource']>>
export type _LabelListItem = Assert<Same<LabelListItem, Schemas['LabelListItem']>>
export type _LabelPage = Assert<Same<LabelPage, Schemas['LabelPage']>>
export type _LabelSlot = Assert<Same<LabelSlot, Schemas['LabelSlot']>>
export type _LibraryPhoto = Assert<Same<LibraryPhoto, Schemas['LibraryPhoto']>>
export type _ManagedUser = Assert<Same<ManagedUser, Schemas['UserWithCapabilities']>>
export type _Manual = Assert<Same<Manual, Schemas['Manual']>>
export type _ManualLibraryPage = Assert<Same<ManualLibraryPage, Schemas['ManualLibraryPage']>>
export type _Organizer = Assert<Same<Organizer, Schemas['Organizer']>>
export type _OrganizerLabel = Assert<Same<OrganizerLabel, Schemas['OrganizerLabel']>>
export type _OrganizerPage = Assert<Same<OrganizerPage, Schemas['OrganizerPage']>>
export type _OrganizerTool = Assert<Same<OrganizerTool, Schemas['OrganizerTool']>>
export type _Photo = Assert<Same<Photo, Schemas['Photo']>>
export type _PhotoLibraryPage = Assert<Same<PhotoLibraryPage, Schemas['LibraryPage']>>
export type _PhotoOwner = Assert<Same<PhotoOwner, Schemas['PhotoOwner']>>
export type _PhotoOwnerKind = Assert<Same<PhotoOwnerKind, Schemas['PhotoOwnerKind']>>
export type _PhotoOwnerRef = Assert<Same<PhotoOwnerRef, Schemas['PhotoOwnerRef']>>
export type _PhotoSearchResult = Assert<Same<PhotoSearchResult, Schemas['PhotoSearchResult']>>
export type _PhotoSource = Assert<Same<PhotoSource, Schemas['PhotoSource']>>
export type _PhotoSuggestion = Assert<Same<PhotoSuggestion, Schemas['PhotoSuggestion']>>
export type _Role = Assert<Same<Role, Schemas['Role']>>
export type _SearchEngineSettings = Assert<Same<SearchEngineSettings, Schemas['EngineSettings']>>
export type _SearchProvider = Assert<Same<SearchProvider, Schemas['SearchProvider']>>
export type _Session = Assert<Same<Session, Schemas['SessionResponse']>>
export type _SuggestionProvider = Assert<Same<SuggestionProvider, Schemas['SuggestionProvider']>>
export type _SystemCount = Assert<Same<SystemCount, Schemas['SystemCount']>>
export type _ToolAttribute = Assert<Same<ToolAttribute, Schemas['ToolAttribute']>>
export type _ToolCase = Assert<Same<ToolCase, Schemas['ToolCase']>>
export type _ToolCondition = Assert<Same<ToolCondition, Schemas['ToolCondition']>>
export type _ToolDetail = Assert<Same<ToolDetail, Schemas['ToolDetail']>>
export type _ToolImportResult = Assert<Same<ToolImportResult, Schemas['ImportResponse']>>
export type _ToolListItem = Assert<Same<ToolListItem, Schemas['ToolListItem']>>
export type _ToolPage = Assert<Same<ToolPage, Schemas['ToolListPage']>>
export type _ToolPlacement = Assert<Same<ToolPlacement, Schemas['ToolPlacement']>>
export type _User = Assert<Same<User, Schemas['User']>>

// The case import, whose shapes the contract states inline on the operations
// rather than as named schemas, so these are checked field by field.
export type _CaseImportSource = Assert<
  Same<
    CaseImportSource,
    NonNullable<
      NonNullable<
        paths['/api/cases/import/sources']['get']['responses'][200]['content']['application/json']
      >['sources']
    >[number]
  >
>
