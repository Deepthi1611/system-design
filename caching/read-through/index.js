const fakeDatabase = {
  1: { id: 1, name: 'Deepthi', plan: 'Pro' },
};

function readFromDatabase(userId) {
  console.log('Reading from database...');
  return fakeDatabase[userId] || null;
}

class ReadThroughCache {
  constructor(loader) {
    this.loader = loader;
    this.store = new Map();
  }

  get(key) {
    if (this.store.has(key)) {
      console.log('Cache hit');
      return this.store.get(key);
    }

    console.log('Cache miss');
    const value = this.loader(key);

    if (value) {
      this.store.set(key, value);
    }

    return value;
  }
}

const userCache = new ReadThroughCache(readFromDatabase);

function showUserProfile(userId) {
  return userCache.get(userId);
}

console.log('Application asks cache for user:');
console.log(showUserProfile(1));

console.log('\nApplication asks cache again:');
console.log(showUserProfile(1));
