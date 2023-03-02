export type Watcher<T> = {
  subscribe(
    onNext: (value: T) => void,
    onError: (error: any) => void,
  ): Subscription;
};

export type Subscription = {
  unsubscribe(): void;
};

export type PaginatedContent<T> = {
  content: T;
  loadMore?: () => Promise<void>;
};
