const cache = new Map();

const fakeDatabase = {
  1: { id: 1, name: 'Deepthi', score: 10 },
};

function writeUser(userId, userData) {
  cache.set(userId, userData);
  console.log('Written to cache only');
}

function flushCacheToDatabase(userId) {
  const user = cache.get(userId);

  if (!user) {
    return;
  }

  fakeDatabase[userId] = user;
  console.log('Flushed cache data to database');
}

console.log('Initial database value:');
console.log(fakeDatabase[1]);

console.log('\nWrite updated value:');
writeUser(1, { id: 1, name: 'Deepthi', score: 20 });

console.log('\nDatabase before flush:');
console.log(fakeDatabase[1]);

console.log('\nFlush cache to database:');
flushCacheToDatabase(1);

console.log('\nDatabase after flush:');
console.log(fakeDatabase[1]);
