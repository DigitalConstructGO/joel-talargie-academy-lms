export type TelegramLanguage = 'en' | 'am';

export interface TelegramTranslations {
  // Menu & Navigation
  myCourses: string;
  myProgress: string;
  payments: string;
  certificates: string;
  notifications: string;
  myAccount: string;
  browseCourses: string;
  settings: string;
  openAcademy: string;
  help: string;
  switchLanguage: string;
  mainMenu: string;
  back: string;
  backToCourses: string;

  // Language Selection
  selectLanguageTitle: string;
  languageChangedSuccess: string;

  // Unlinked Onboarding
  createAccount: string;
  connectExistingAccount: string;
  unlinkedWelcomeTitle: string;
  unlinkedWelcomeBody: string;

  // User Screens & Settings
  welcomeBack: (name: string) => string;
  accountTitle: string;
  helpTitle: string;
  settingsTitle: string;
  openProfile: string;
  openAcademySettings: string;
  disconnectTelegram: string;
  openNotifications: string;
  enrollNow: string;
  continueLearning: string;
  viewPayments: string;

  // Account Summary Labels
  nameLabel: string;
  emailLabel: string;
  roleLabel: string;
  telegramStatusLabel: string;
  accountStatusLabel: string;
  connectedBadge: string;
  activeBadge: string;

  // Course Card Labels
  categoryLabel: string;
  priceLabel: string;
  typeLabel: string;
  freeLabel: string;
  paidLabel: string;
  viewDetails: string;
  noCoursesFound: string;
  showingCourses: (
    start: number,
    end: number,
    total: number,
    page: number,
    totalPages: number,
  ) => string;

  // Learning & Progress Labels
  learningProgressTitle: string;
  requiredLessonsCompleted: (completed: number, total: number) => string;
  myEnrolledCoursesTitle: string;
  noEnrolledCourses: string;
  progressLabel: string;
  statusLabel: string;

  // Status Values
  statusEnrolled: string;
  statusInProgress: string;
  statusCompleted: string;
  statusPendingPayment: string;
  statusWaitingApproval: string;
  statusCancelled: string;
  statusAccessRevoked: string;

  // Payment Labels
  paymentSummaryTitle: string;
  paymentRecordsTitle: string;
  courseLabel: string;
  amountLabel: string;
  dateLabel: string;
  noPaymentsFound: string;
  paymentPendingReview: string;
  paymentApproved: string;
  paymentDeclined: string;
  paymentFailed: string;

  // Certificate Labels
  myCertificateTitle: string;
  myCertificatesTitle: string;
  issuedLabel: string;
  certificateAvailableBadge: string;
  noCertificatesFound: string;

  // Notifications
  notificationsTitle: string;
  noNotificationsFound: string;
  readBadge: string;
  newBadge: string;

  // Pagination & Filters
  previous: string;
  next: string;
  search: string;
  filter: (type?: string | null) => string;
  clearSearch: string;

  // Unlink & System
  accountDisconnectedTitle: string;
  accountDisconnectedBody: string;
  accountNotConnectedText: string;
  accountSuspendedText: string;
}

export const TELEGRAM_TRANSLATIONS: Record<
  TelegramLanguage,
  TelegramTranslations
> = {
  en: {
    myCourses: '📚 My Courses',
    myProgress: '📈 My Progress',
    payments: '💳 Payments',
    certificates: '🏆 Certificates',
    notifications: '🔔 Notifications',
    myAccount: '👤 My Account',
    browseCourses: '🔍 Browse Courses',
    settings: '⚙️ Settings',
    openAcademy: '🌐 Open Academy',
    help: '❓ Help',
    switchLanguage: '🌐 Language / ቋንቋ',
    mainMenu: '🏠 Main Menu',
    back: '⬅️ Back',
    backToCourses: '⬅️ Back to Courses',

    selectLanguageTitle:
      '🌐 **Select Preferred Language / ቋንቋ ይምረጡ:**\n\nChoose the language you prefer for the bot menu and messages:',
    languageChangedSuccess: 'Language changed to English 🇺🇸',

    createAccount: 'Create Account',
    connectExistingAccount: 'Connect Existing Account',
    unlinkedWelcomeTitle: 'Welcome to Joel Talargie Academy 👋',
    unlinkedWelcomeBody:
      'Your Telegram account is not connected yet.\n\nChoose an option:',

    welcomeBack: (name: string) =>
      `Welcome back to Joel Talargie Academy 👋\n\nHello <b>${name}</b>! What would you like to do?`,
    accountTitle: '👤 <b>My Academy Account</b>',
    helpTitle: '❓ <b>Joel Talargie Academy Help & Support</b>',
    settingsTitle: '⚙️ <b>Telegram Bot Settings</b>',
    openProfile: 'Open Profile',
    openAcademySettings: 'Open Academy Settings',
    disconnectTelegram: '🔓 Disconnect Telegram',
    openNotifications: 'Open Notifications',
    enrollNow: '🚀 Enroll Now',
    continueLearning: '▶️ Continue Learning',
    viewPayments: '💳 View Payments',

    nameLabel: 'Name',
    emailLabel: 'Email',
    roleLabel: 'Role',
    telegramStatusLabel: 'Telegram',
    accountStatusLabel: 'Account Status',
    connectedBadge: 'Connected ✅',
    activeBadge: 'Active ✅',

    categoryLabel: 'Category',
    priceLabel: 'Price',
    typeLabel: 'Type',
    freeLabel: 'Free',
    paidLabel: 'Paid',
    viewDetails: '📖 View Details',
    noCoursesFound: 'No courses found matching your criteria.',
    showingCourses: (start, end, total, page, totalPages) =>
      `Showing ${start}–${end} of ${total} courses (Page ${page} of ${totalPages})`,

    learningProgressTitle: '📈 Learning Progress',
    requiredLessonsCompleted: (completed, total) =>
      `${completed} / ${total} required lessons completed`,
    myEnrolledCoursesTitle: '📚 My Courses',
    noEnrolledCourses: 'You do not have any active enrolled courses yet.',
    progressLabel: 'Progress',
    statusLabel: 'Status',

    statusEnrolled: 'Enrolled',
    statusInProgress: 'In Progress',
    statusCompleted: 'Completed 🎉',
    statusPendingPayment: 'Pending Payment ⏳',
    statusWaitingApproval: 'Waiting Payment Approval ⏳',
    statusCancelled: 'Cancelled',
    statusAccessRevoked: 'Access Revoked',

    paymentSummaryTitle: '💳 Payment Summary',
    paymentRecordsTitle: '💳 My Payments',
    courseLabel: 'Course',
    amountLabel: 'Amount',
    dateLabel: 'Date',
    noPaymentsFound: "You don't have any payment records yet.",
    paymentPendingReview: 'Pending Review ⏳',
    paymentApproved: 'Approved ✅',
    paymentDeclined: 'Declined ❌',
    paymentFailed: 'Failed ❌',

    myCertificateTitle: '🏆 My Certificate',
    myCertificatesTitle: '🏆 My Certificates',
    issuedLabel: 'Issued',
    certificateAvailableBadge: 'Available ✅',
    noCertificatesFound: "You don't have any earned certificates yet.",

    notificationsTitle: '🔔 Notifications',
    noNotificationsFound: 'No new notifications.',
    readBadge: ' (Read)',
    newBadge: ' 🟢 (New)',

    previous: '◀️ Previous',
    next: 'Next ▶️',
    search: '🔎 Search',
    filter: (type?: string | null) =>
      type ? `🎯 Filter: ${type}` : '🎯 Filter',
    clearSearch: '❌ Clear Search',

    accountDisconnectedTitle: '🔓 Telegram Account Disconnected',
    accountDisconnectedBody:
      'Your Telegram account has been unlinked from your Joel Talargie Academy profile.',
    accountNotConnectedText:
      'Your Telegram account is not connected to an academy account.',
    accountSuspendedText:
      'Your Joel Academy account is currently restricted or suspended. Please contact platform support.',
  },
  am: {
    myCourses: '📚 የእኔ ኮርሶች',
    myProgress: '📈 የእኔ እድገት',
    payments: '💳 ክፍያዎች',
    certificates: '🏆 ሰርተፊኬቶች',
    notifications: '🔔 ማስታወቂያዎች',
    myAccount: '👤 የእኔ መለያ',
    browseCourses: '🔍 ኮርሶችን ይፈልጉ',
    settings: '⚙️ መቼቶች',
    openAcademy: '🌐 አካዳሚውን ክፈት',
    help: '❓ እርዳታ',
    switchLanguage: '🌐 ቋንቋ / Language',
    mainMenu: '🏠 ዋና ማውጫ',
    back: '⬅️ ተመለስ',
    backToCourses: '⬅️ ወደ ኮርሶች ተመለስ',

    selectLanguageTitle:
      '🌐 **ቋንቋ ይምረጡ / Select Preferred Language:**\n\nለቦት ማውጫዎች እና መልዕክቶች የሚመርጡትን ቋንቋ ይምረጡ:',
    languageChangedSuccess: 'ቋንቋው ወደ አማርኛ ተቀይሯል 🇪🇹',

    createAccount: 'አዲስ መለያ ፍጠር',
    connectExistingAccount: 'ነባር መለያ አገናኝ',
    unlinkedWelcomeTitle: 'እንኳን ወደ ዮኤል ታላርጊ አካዳሚ በደህና መጡ 👋',
    unlinkedWelcomeBody: 'የቴሌግራም መለያዎ ገና አልተገናኘም።\n\nእባክዎን ከታች ካሉት አንዱን ይምረጡ:',

    welcomeBack: (name: string) =>
      `እንኳን ወደ ዮኤል ታላርጊ አካዳሚ በደህና መጡ 👋\n\nሰላም <b>${name}</b>! ምን ማድረግ ይፈልጋሉ?`,
    accountTitle: '👤 <b>የእኔ መለያ መረጃ</b>',
    helpTitle: '❓ <b>የዮኤል ታላርጊ አካዳሚ እርዳታ እና ድጋፍ</b>',
    settingsTitle: '⚙️ <b>የቴሌግራም ቦት መቼቶች</b>',
    openProfile: 'መለያዬን ክፈት',
    openAcademySettings: 'የአካዳሚ መቼቶችን ክፈት',
    disconnectTelegram: '🔓 ቴሌግራምን ያላቅቁ',
    openNotifications: 'ማስታወቂያዎችን ክፈት',
    enrollNow: '🚀 አሁኑኑ ይመዝገቡ',
    continueLearning: '▶️ ትምህርቱን ይቀጥሉ',
    viewPayments: '💳 ክፍያዎችን ይመልከቱ',

    nameLabel: 'ስም',
    emailLabel: 'ኢሜይል',
    roleLabel: 'ሚና',
    telegramStatusLabel: 'ቴሌግራም',
    accountStatusLabel: 'የመለያ ሁኔታ',
    connectedBadge: 'ተገናኝቷል ✅',
    activeBadge: 'ንቁ ✅',

    categoryLabel: 'ምድብ',
    priceLabel: 'ዋጋ',
    typeLabel: 'ዓይነት',
    freeLabel: 'ነፃ',
    paidLabel: 'የሚከፈልበት',
    viewDetails: '📖 ዝርዝር ይመልከቱ',
    noCoursesFound: 'ከፍለጋዎ ጋር የሚጣጣም ምንም ኮርስ አልተገኘም።',
    showingCourses: (start, end, total, page, totalPages) =>
      `ከ ${total} ኮርሶች ውስጥ ${start}–${end} በመታየት ላይ ይገኛሉ (ገጽ ${page} ከ ${totalPages})`,

    learningProgressTitle: '📈 የትምህርት እድገት',
    requiredLessonsCompleted: (completed, total) =>
      `ከ ${total} አስገዳጅ ትምህርቶች ${completed} ተጠናቀዋል`,
    myEnrolledCoursesTitle: '📚 የተመዘገብኳቸው ኮርሶች',
    noEnrolledCourses: 'እስካሁን በምንም ኮርስ አልተመዘገቡም።',
    progressLabel: 'እድገት',
    statusLabel: 'ሁኔታ',

    statusEnrolled: 'ተመዝግቧል',
    statusInProgress: 'በሂደት ላይ',
    statusCompleted: 'ተጠናቋል 🎉',
    statusPendingPayment: 'ክፍያ በመጠባበቅ ላይ ⏳',
    statusWaitingApproval: 'የክፍያ ማረጋገጫ በመጠባበቅ ላይ ⏳',
    statusCancelled: 'ተሰርዟል',
    statusAccessRevoked: 'መዳረሻ ተሰርዟል',

    paymentSummaryTitle: '💳 የክፍያ ማጠቃለያ',
    paymentRecordsTitle: '💳 የክፍያ መዝገቦች',
    courseLabel: 'ኮርስ',
    amountLabel: 'መጠን',
    dateLabel: 'ቀን',
    noPaymentsFound: 'ምንም የክፍያ ታሪክ አልተገኘም።',
    paymentPendingReview: 'በግምገማ ላይ ⏳',
    paymentApproved: 'ጽድቋል ✅',
    paymentDeclined: 'ተቀባይነት አላገኘም ❌',
    paymentFailed: 'አልተሳካም ❌',

    myCertificateTitle: '🏆 የእኔ ሰርተፊኬት',
    myCertificatesTitle: '🏆 የእኔ ሰርተፊኬቶች',
    issuedLabel: 'የተሰጠበት ቀን',
    certificateAvailableBadge: 'ዝግጁ ነው ✅',
    noCertificatesFound: 'እስካሁን ምንም ሰርተፊኬት አልተገኘም።',

    notificationsTitle: '🔔 ማስታወቂያዎች',
    noNotificationsFound: 'ምንም አዲስ ማስታወቂያ የለም።',
    readBadge: ' (ተነቧል)',
    newBadge: ' 🟢 (አዲስ)',

    previous: '◀️ ቀዳሚ',
    next: 'ቀጣይ ▶️',
    search: '🔎 ፈልግ',
    filter: (type?: string | null) => (type ? `🎯 ማጣሪያ: ${type}` : '🎯 ማጣሪያ'),
    clearSearch: '❌ ፍለጋውን አጽዳ',

    accountDisconnectedTitle: '🔓 የቴሌግራም መለያ ተቋርጧል',
    accountDisconnectedBody: 'የቴሌግራም መለያዎ ከዮኤል ታላርጊ አካዳሚ መለያዎ ተላቋል።',
    accountNotConnectedText: 'የቴሌግራም መለያዎ ከምንም የአካዳሚ መለያ ጋር አልተገናኘም።',
    accountSuspendedText:
      'የእርስዎ የዮኤል አካዳሚ መለያ ለጊዜው ታግዷል። እባክዎን የፕላትፎርም ድጋፍን ያነጋግሩ።',
  },
};

export function getTranslations(lang?: TelegramLanguage): TelegramTranslations {
  return TELEGRAM_TRANSLATIONS[lang === 'am' ? 'am' : 'en'];
}
