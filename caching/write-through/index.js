const cache = new Map();

const fakeDatabase = {
  1: { id: 1, name: 'Deepthi', city: 'Hyderabad' },
};

function writeUser(userId, userData) {
  fakeDatabase[userId] = userData;
  cache.set(userId, userData);
  console.log('Written to database and cache');
}

function getUser(userId) {
  if (cache.has(userId)) {
    console.log('Reading from cache...');
    return cache.get(userId);
  }

  console.log('Reading from database...');
  const user = fakeDatabase[userId] || null;

  if (user) {
    cache.set(userId, user);
  }

  return user;
}

console.log('Write user:');
writeUser(1, { id: 1, name: 'Deepthi', city: 'Bengaluru' });

console.log('\nRead user:');
console.log(getUser(1));
