
export interface Designation {
  id: string;
  title: string;
  subDepartmentId: string;
  createdAt?: string;
}

export interface SubDepartment {
  id: string;
  name: string;
  departmentId: string;
  designations?: Designation[];
}

export interface Department {
  id: string;
  name: string;
  createdAt: string;
  subDepartments: SubDepartment[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type Role = 'SUPPORT' | 'TASK_ASSIGNER' | 'DEVELOPER' | 'SUPERADMIN' | 'STAFF' | 'ADMIN';

export interface Address {
  pincode: string;
  state: string;
  district: string;
  fullAddress: string;
  country: string;
}

export interface WorkExperience {
  companyName: string;
  designation: string;
  contactNumber?: string;
  startDate: string;
  endDate?: string;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
}

export interface StaffDocuments {
  adharFront?: string;
  adharBack?: string;
  signature?: string;
  photo?: string;
  experienceLetter?: string;
  bankStatement?: string;
  otherDocuments?: string[];
}

export interface User {
  id: string;
  name: string;
  role: Role;
  isSuperAdmin: boolean;
  departmentId?: string;
  subDepartmentId?: string;
  email: string;
  permissions?: string[];
}

export interface Staff extends User {
  mobileNumber?: string;
  designationId?: string;
  designation?: string | Designation;
  adharNumber?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  healthIssue?: boolean;
  healthIssueDescription?: string;
  maritalStatus?: string;
  haveVehicle?: boolean;
  vehicleNumber?: string;
  fatherName?: string;
  motherName?: string;
  formNumber?: string;
  registrationDate?: string;
  registrationType?: 'NEW' | 'PAST'; 
  addresses?: ({ type: 'CURRENT' | 'PERMANENT' } & Address)[];
  experiences?: WorkExperience[];
  bankDetails?: BankDetails;
  documents?: StaffDocuments;
  createdAt: string;
  updatedAt: string;
  departmentName?: string;
  subDepartmentName?: string;
}

export interface SystemPermission {
  id: string;
  name: string;
  label: string;
  group?: string;
  createdAt?: string;
}

export interface PermissionGroupResponse {
  group: string;
  permissions: SystemPermission[];
}

export type AppView = 'home' | 'hr' | 'create_staff' | 'edit_staff' | 'task_list' | 'my_tasks' | 'live_chat' | 'tickets' | 'contact_support_list' | 'department_manager' | 'system_permissions';

export interface LoginResponse {
  message: string;
  token: string;
  chatToken?: string;
  user: User;
  session: {
    id: string;
    loginTime: string;
  };
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskSource {
  INTERNAL = 'INTERNAL',
  TICKET = 'TICKET'
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  staffId: string;
  note: string;
  previousStatus?: TaskStatus;
  newStatus?: TaskStatus;
  createdAt: string;
  staff: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  source?: TaskSource;
  assignmentType?: string;
  assignedToId?: string;
  assignedToDepartmentId?: string;
  assignedToSubDepartmentId?: string;
  assignedToRole?: string;
  assignedTo?: User;
  assignedToDepartment?: Department;
  createdBy?: User;
  createdAt: string;
  updatedAt: string;
  taskUpdates?: TaskUpdate[];
}

export enum TicketStatus {
  UNASSIGNED = 'UNASSIGNED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_CUSTOMER = 'WAITING_CUSTOMER',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum TicketPriority {
  NORMAL = 'NORMAL',
  MEDIUM = 'MEDIUM',
  URGENT = 'URGENT'
}

export interface ContactReply {
  id: string;
  contactId: string;
  staffId: string;
  message: string;
  attachments?: {
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  }[];
  emailSent: boolean;
  createdAt: string;
  updatedAt: string;
  staff: {
    id: string;
    name: string;
  };
}

export interface ContactSupport {
  id: string;
  fullName: string;
  email: string;
  subject: string;
  message: string;
  type: string;
  source: string;
  status: string;
  attachments?: any;
  createdAt: string;
  updatedAt: string;
  
  // Lock information
  isLocked: boolean;
  lockedBy?: { id: string; name: string; email: string };
  lockTimeRemaining: number;
  lockTimeRemainingFormatted?: string;
  lockExpiresAt?: string;
  
  // Ticket creation permissions
  canCreateTicket: boolean;
  cannotCreateReason?: string | null;
  actionMessage?: string | null;
  
  // Cooldown information
  isInCooldown: boolean;
  cooldownRemaining: number;
  cooldownRemainingFormatted?: string;
  cooldownExpiry?: string;
  
  // Ticket history details
  totalTickets: number;
  recentTickets: {
    id: string;
    ticketNumber: string | number;
    subject: string;
    status: string;
    priority: string;
    createdAt: string;
    createdAtFormatted: string;
    createdBy: string;
    timeAgo: string;
  }[];
  
  // Conversion fields
  convertedBy?: { id: string; name: string; email: string };
  convertedAt?: string;
  convertedAtFormatted?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string | number;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: string;
  source: 'CHAT' | 'CONTACT';
  userSource?: string;
  userType?: string;
  chatSessionId?: string;
  chatUser?: {
    name: string;
    email: string;
  };
  sourceContact?: ContactSupport;
  createdAt: string;
  updatedAt: string;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';

export interface ChatMessage {
  id?: string;
  content: string;
  type: MessageType;
  fileName?: string;
  fileSize?: number;
  senderId: string;
  senderType: 'staff' | 'user';
  timestamp: string;
}
