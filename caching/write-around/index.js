const cache = new Map();

const fakeDatabase = {
  1: { id: 1, name: 'Deepthi', status: 'active' },
};

function writeUser(userId, userData) {
  fakeDatabase[userId] = userData;
  cache.delete(userId);
  console.log('Written to database and skipped cache');
}

function getUser(userId) {
  if (cache.has(userId)) {
    console.log('Cache hit');
    return cache.get(userId);
  }

  console.log('Cache miss');
  console.log('Reading from database...');

  const user = fakeDatabase[userId] || null;

  if (user) {
    cache.set(userId, user);
  }

  return user;
}

console.log('Write user:');
writeUser(1, { id: 1, name: 'Deepthi', status: 'inactive' });

console.log('\nFirst read after write:');
console.log(getUser(1));

console.log('\nSecond read:');
console.log(getUser(1));
