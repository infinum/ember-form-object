let hasLoadedMockData = false;

const users = {
  data: [
    { id: '1', type: 'user', attributes: { name: 'Mom' }, relationships: {} },
    { id: '2', type: 'user', attributes: { name: 'Son' }, relationships: {} }
  ],
  included: [],
  links: {},
  meta: {}
};

const todos = {
  data: [{
    id: '1',
    type: 'todo',
    attributes: {
      title: 'Wash dishes',
      description: 'It\'s about time.',
      completed: false
    },
    relationships: {
      assignee: { data: { id: '1', type: 'user' } }
    }
  }, {
    id: '2',
    type: 'todo',
    attributes: {
      title: 'Watch TV',
      description: 'And rest.',
      completed: false
    },
    relationships: {
      assignee: { data: { id: '2', type: 'user' } }
    }
  }],
  included: [],
  links: {},
  meta: {}
};

export default function(store) {
  if (hasLoadedMockData) {
    return;
  } else {
    hasLoadedMockData = true;
  }

  store.pushPayload('user', users);
  store.pushPayload('todo', todos);
}
