// requests
const login = new URLSearchParams(window.location.search).get('channel');
const gqlQuery = (operationName, sha256Hash, variables) => ({
  operationName,
  extensions: { persistedQuery: { version: 1, sha256Hash } },
  variables,
});
// prettier-ignore
const ops = [
  gqlQuery('ChannelShell',             '580ab410bcd0c1ad194224957ae2241e5d252b2c5173d8e0cce9d32d5bb14efe', { login }),
  gqlQuery('ChatList_Badges',          '838a7e0b47c09cac05f93ff081a9ff4f876b68f7624f0fc465fe30031e372fc2', { channelLogin: login }),
  gqlQuery('BitsConfigContext_Global', '6a265b86f3be1c8d11bdcf32c183e106028c6171e985cc2584d15f7840f5fee6', {}),
  gqlQuery('GlobalBadges',             '9db27e18d61ee393ccfdec8c7d90f14f9a11266298c2e5eb808550b77d7bcdf6', {}),
];
const promise = fetch('https://gql.twitch.tv/gql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
  },
  body: JSON.stringify(ops),
}).then((res) => res.json());

const buildCheerImages = (
  bits,
  { backgrounds, scales, types },
  templateUrl,
) => {
  const images = {};
  for (const bg of backgrounds) {
    images[bg] = {};
    for (const { animation, extension } of types) {
      images[bg][animation] = {};
      for (const scale of scales) {
        images[bg][animation][scale] = templateUrl
          .replace('PREFIX', 'cheer')
          .replace('BACKGROUND', bg)
          .replace('ANIMATION', animation)
          .replace('TIER', bits)
          .replace('SCALE', scale)
          .replace('EXTENSION', extension);
      }
    }
  }
  return images;
};

const normalizeBadgeVersion = (badgeVersion) => ({
  id: badgeVersion.version,
  image_url_1x: badgeVersion.image1x,
  image_url_2x: badgeVersion.image2x,
  image_url_4x: badgeVersion.image4x,
  title: badgeVersion.title,
  description: '',
  click_action: badgeVersion.clickAction,
  click_url: badgeVersion.clickURL,
});

const handlers = {
  '/users': (cb, [channelShell]) => {
    const user = channelShell.data.userOrError;
    cb({
      data: [
        {
          id: user.id,
          login: user.login,
          display_name: user.displayName,
          type: '',
          broadcaster_type: '',
          description: '',
          profile_image_url: '',
          offline_image_url: '',
          view_count: 0,
          created_at: new Date().toISOString(),
        },
      ],
    });
  },

  '/chat/badges/global': (cb, [, , , globalBadges]) => {
    const badges = globalBadges.data.badges;
    const badgesBySetId = {};
    for (const badge of badges) {
      const setId = badge.setID;
      if (!badgesBySetId[setId]) badgesBySetId[setId] = [];
      badgesBySetId[setId].push(badge);
    }
    const result = [];
    for (const [setId, badges] of Object.entries(badgesBySetId)) {
      const versions = badges.map(normalizeBadgeVersion);
      result.push({ set_id: setId, versions });
    }
    cb({ data: result });
  },

  '/bits/cheermotes': (cb, [, , bitsCfg]) => {
    const cfg = bitsCfg.data.cheerConfig;
    const colors = [...cfg.displayConfig.colors].reverse();
    const getColor = (n) => {
      for (const color of colors) {
        if (n >= color.bits) return color.color;
      }
      return '#979797';
    };
    const cheermotes = [];
    for (const group of cfg.groups[0].nodes) {
      const tiers = [];
      for (const tier of group.tiers) {
        tiers.push({
          min_bits: tier.bits,
          id: tier.bits.toString(),
          color: getColor(tier.bits),
          images: buildCheerImages(
            tier.bits,
            cfg.displayConfig,
            cfg.groups[0].templateURL,
          ),
        });
      }
      cheermotes.push({
        prefix: group.prefix,
        type: group.type,
        order: cfg.displayConfig.order.indexOf(group.type),
        last_updated: new Date().toISOString(),
        is_charitable: false,
        tiers,
      });
    }
    cb({ data: cheermotes });
  },

  '/chat/badges': (cb, [, chatListBadges]) => {
    const result = [];
    const badges = chatListBadges.data.user.broadcastBadges;
    const versions = badges.map(normalizeBadgeVersion);
    result.push({ set_id: 'subscriber', versions });
    cb({ data: result });
  },
};

const _ajax = $.ajax;
$.ajax = (opts) => {
  if (!opts.url.startsWith('https://giambaj.it/twitch/api/')) {
    return _ajax(opts);
  }
  const endpoint = new URL(opts.url).searchParams.get('endpoint');
  const path = decodeURIComponent(endpoint);
  const url = new URL(`http://localhost${path}`);
  const handler = handlers[url.pathname];
  if (!handler) return _ajax(opts);
  const done = (cb) =>
    promise.then((res) =>
      handler((data) => {
        console.log(path);
        console.log(data);
        cb(data);
      }, res),
    );
  return { done };
};

// twemoji
const _twemojiParse = twemoji.parse;
twemoji.parse = (what, how) => {
  if (how) how.base = './twemoji/assets/';
  return _twemojiParse(what, how);
};

// styles
$.attrHooks = $.attrHooks || {};
const _oldHrefHook = $.attrHooks.href && $.attrHooks.href.set;
$.attrHooks.href = {
  set: (elem, value) => {
    if (
      elem.tagName &&
      elem.tagName.toLowerCase() === 'link' &&
      value.startsWith('styles')
    ) {
      value = `./${value}`;
    }
    if (typeof _oldHrefHook === 'function') {
      return _oldHrefHook.call(this, elem, value);
    } else {
      elem.setAttribute('href', value);
      return value;
    }
  },
};
