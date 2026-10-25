// The data repository: the one surface the UI talks to.
//
// Today every function is backed by the mock layer in data/mock (localStorage
// and seed data). To move to a real backend (Supabase, EU region), replace the
// bodies behind these exports, module by module; no screen imports data/mock
// directly, so no screen has to change. Internals of the mock (storage keys,
// raw seed arrays, store loaders) are deliberately not exported here.

export {
  type BerthOperationalInfo,
  getBerthStatuses,
  suggestReleasedBerths,
} from "@/data/mock/berthStatus";

export {
  type CalendarDay,
  type CalendarState,
  type MockNotification,
  RELETTING_PROGRESS,
  RELETTING_STATUS_LABELS,
  type RelettingDraft,
  type ReletSplit,
  type RelettingQueueItem,
  type RelettingRequest,
  advanceRelettingStatus,
  cancelRelettingRequest,
  clearRelettingDraft,
  decideReletting,
  defaultNightsBooked,
  emptyMockReletting,
  estimateReletting,
  getBerthCalendar,
  getNotifications,
  getRelettingDraft,
  getRelettingQueue,
  getRelettingRequests,
  isRelettingEditable,
  markNotificationsRead,
  requestEarlyReturn,
  resetMockReletting,
  saveRelettingDraft,
  startRelettingDraftFrom,
  submitRelettingRequest,
  updateRelettingRequest,
} from "@/data/mock/reletting";

export {
  type OwnedBerth,
  type CurrentUser,
  type DevPersona,
  type Mode,
  type Role,
  getActivePersonaId,
  getAvailableModes,
  getCurrentUser,
  getMarinaBerthLinks,
  getMode,
  getOwnedBerths,
  listDevPersonas,
  setMode,
  signInAs,
  signOut,
  updateProfile,
} from "@/data/mock/accounts";

export {
  EMPTY_ENQUIRY_DOCUMENTS,
  type Enquiry,
  type EnquiryStatus,
  clearBerthOutOfService,
  decideEnquiry,
  getEnquiries,
  getOutOfServiceBerths,
  markEnquiryArrived,
  markEnquiryDeparted,
  reassignEnquiryBerth,
  resetMockEnquiries,
  resetMockOutOfService,
  setBerthOutOfService,
  setEnquiryFlag,
  submitEnquiry,
} from "@/data/mock/enquiries";

export { MOCK_CHANGED_EVENT, MOCK_STORAGE_KEYS } from "@/data/mock/storage";

export {
  type PreArrivalCheckIn,
  clearPreArrivalDraft,
  getAllPreArrivalCheckIns,
  getAllPreArrivalDrafts,
  getLastSubmittedCrew,
  getPreArrivalCheckInsForStaff,
  getPreArrivalDraft,
  markPreArrivalCheckedIn,
  resetMockPreArrival,
  savePreArrivalDraft,
  submitPreArrivalCheckIn,
} from "@/data/mock/prearrival";

export { useMock } from "./useMock";
