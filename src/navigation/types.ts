export type MainTabParamList = {
  Calendar: undefined;
  Stats: undefined;
  Today: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Register: undefined;
  BlocksSelection: undefined;
  SpecialBlocks: undefined;
  NotificationTime: undefined;
  SoulReveal: undefined;
  MainTabs: undefined;
  DayDetail: { date: string };
};