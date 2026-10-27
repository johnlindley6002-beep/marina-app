// The data repository: the one surface the UI talks to.
//
// The staff back office (arrivals, the berth map, relet approvals) reads and
// writes Supabase through ./staff, and every function there returns a Promise.
// Everything else is still backed by the mock layer in data/mock (localStorage
// and seed data); move it the same way, module by module. No screen imports
// data/mock directly. Internals of the mock (storage keys, raw seed arrays,
// store loaders) are deliberately not exported here.

export { type BerthOperationalInfo } from "@/data/mock/berthStatus";

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
  cancelRelettingRequest,
  clearRelettingDraft,
  defaultNightsBooked,
  emptyMockReletting,
  estimateReletting,
  getBerthCalendar,
  getNotifications,
  getRelettingDraft,
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
  resetMockEnquiries,
  resetMockOutOfService,
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

export { type OutOfServiceMark } from "@/data/mock/enquiries";

export * from "./staff";

export { useMock } from "./useMock";
export { useStaffData } from "./useStaffData";
