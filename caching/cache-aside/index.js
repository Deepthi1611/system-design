const cache = new Map();

const fakeDatabase = {
  1: { id: 1, name: 'Deepthi', role: 'Backend Engineer' },
};

function getUserFromDatabase(userId) {
  console.log('Reading from database...');
  return fakeDatabase[userId] || null;
}

function getUser(userId) {
  const cachedUser = cache.get(userId);

  if (cachedUser) {
    console.log('Cache hit');
    return cachedUser;
  }

  console.log('Cache miss');
  const user = getUserFromDatabase(userId);

  if (user) {
    cache.set(userId, user);
  }

  return user;
}

function updateUser(userId, updatedData) {
  if (!fakeDatabase[userId]) {
    return null;
  }

  fakeDatabase[userId] = {
    ...fakeDatabase[userId],
    ...updatedData,
  };

  cache.delete(userId);
  console.log('User updated in database and cache cleared');

  return fakeDatabase[userId];
}

console.log('First read:');
console.log(getUser(1));

console.log('\nSecond read:');
console.log(getUser(1));

console.log('\nUpdate user:');
console.log(updateUser(1, { role: 'System Design Learner' }));

console.log('\nRead after update:');
console.log(getUser(1));
