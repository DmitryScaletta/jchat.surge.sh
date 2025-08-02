const login = new URLSearchParams(window.location.search).get('channel');
const gqlRequest = fetch('https://gql.twitch.tv/gql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Client-ID': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
  },
  body: JSON.stringify([
    {
      operationName: 'ChannelShell',
      variables: { login },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash:
            '580ab410bcd0c1ad194224957ae2241e5d252b2c5173d8e0cce9d32d5bb14efe',
        },
      },
    },
    {
      operationName: 'ChatList_Badges',
      variables: { channelLogin: login },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash:
            '838a7e0b47c09cac05f93ff081a9ff4f876b68f7624f0fc465fe30031e372fc2',
        },
      },
    },
    {
      operationName: 'BitsConfigContext_Global',
      variables: {},
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash:
            '6a265b86f3be1c8d11bdcf32c183e106028c6171e985cc2584d15f7840f5fee6',
        },
      },
    },
    {
      operationName: 'GlobalBadges',
      variables: {},
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash:
            '9db27e18d61ee393ccfdec8c7d90f14f9a11266298c2e5eb808550b77d7bcdf6',
        },
      },
    },
  ]),
});

const promise = gqlRequest.then((res) => res.json());

const _ajax = $.ajax;
$.ajax = (...args) => {
  if (
    !args ||
    !args[0] ||
    typeof args[0] !== 'object' ||
    !args[0].url.startsWith('https://giambaj.it/twitch/api/')
  ) {
    return _ajax(...args);
  }

  const endpoint = new URL(args[0].url).searchParams.get('endpoint') ;
  const path = decodeURIComponent(endpoint);
  const url = new URL(`http://localhost${path}`);

  console.log({ endpoint, pathname: url.pathname });

  const done = async (cb) => {
    if (url.pathname === '/users') {
      return promise.then(([channelShell]) => {
        const { userOrError } = channelShell.data;
        const user = userOrError;
        const usr = {
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
        };
        console.log({ usr });
        cb({ data: [usr] });
      });
    }
    if (url.pathname === '/chat/badges/global') {
      return promise.then(([, , , globalBadges]) => {
        const badgesBySetId = globalBadges.data.badges.reduce(
          (acc, badge) => {
            const set_id = badge.setID;
            if (!acc[set_id]) acc[set_id] = [];
            acc[set_id].push(badge);
            return acc;
          },
          {},
        );

        const badges = [];
        for (const [set_id, versions] of Object.entries(badgesBySetId)) {
          badges.push({
            set_id,
            versions: versions.map((badge) => ({
              id: badge.version,
              image_url_1x: badge.image1x,
              image_url_2x: badge.image2x,
              image_url_4x: badge.image4x,
              title: badge.title,
              description: '',
              click_action: badge.clickAction,
              click_url: badge.clickURL,
            })),
          });
        }
        console.log({ badges });
        cb({ data: badges });
      });
    }
    if (url.pathname === '/bits/cheermotes') {
      return promise.then(([, , bitsConfigContextGlobal]) => {
        const data = bitsConfigContextGlobal.data;
        const orders = data.cheerConfig.displayConfig.order;
        const colors = data.cheerConfig.displayConfig.colors.reverse();
        const cheermotes = [];

        const getColor = (minBits) => {
          for (let i = 0; i < colors.length; i += 1) {
            if (minBits >= colors[i].bits) return colors[i].color;
          }
          return '#979797';
        };

        for (const obj of data.cheerConfig.groups[0].nodes) {
          const order = orders.indexOf(obj.type);
          // prettier-ignore
          cheermotes.push({
            prefix: obj.prefix,
            type: obj.type,
            order,
            last_updated: new Date().toISOString(),
            is_charitable: false,
            tiers: obj.tiers.map((tier) => ({
              min_bits: tier.bits,
              id: tier.id,
              color: getColor(tier.bits),
              images: {
                dark: {
                  animated: {
                    '1':   `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/animated/${tier.id}/1.gif`,
                    '1.5': `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/animated/${tier.id}/1.5.gif`,
                    '2':   `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/animated/${tier.id}/2.gif`,
                    '3':   `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/animated/${tier.id}/3.gif`,
                    '4':   `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/animated/${tier.id}/4.gif`,
                  },
                  static: {
                    '1':   `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/static/${tier.id}/1.png`,
                    '1.5': `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/static/${tier.id}/1.5.png`,
                    '2':   `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/static/${tier.id}/2.png`,
                    '3':   `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/static/${tier.id}/3.png`,
                    '4':   `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/dark/static/${tier.id}/4.png`,
                  },
                },
                light: {
                  animated: {
                    '1':   `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/light/animated/${tier.id}/1.gif`,
                    '1.5': `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/light/animated/${tier.id}/1.5.gif`,
                    '2':   `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/light/animated/${tier.id}/2.gif`,
                    '3':   `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/light/animated/${tier.id}/3.gif`,
                    '4':   `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/light/animated/${tier.id}/4.gif`,
                  },
                  static: {
                    '1':   `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/light/static/${tier.id}/1.png`,
                    '1.5': `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/light/static/${tier.id}/1.5.png`,
                    '2':   `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/light/static/${tier.id}/2.png`,
                    '3':   `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/light/static/${tier.id}/3.png`,
                    '4':   `https://d3aqoihi2n8ty8.cloudfront.net/actions/cheer/light/static/${tier.id}/4.png`,
                  },
                },
              },
            })),
          });
        }
        console.log({ cheermotes });
        cb({ data: cheermotes });
      });
    }
    if (url.pathname === '/chat/badges') {
      return promise.then(([, chatListBadges]) => {
        const user = chatListBadges.data.user;
        const versions = user.broadcastBadges.map((badge) => ({
          id: badge.version,
          image_url_1x: badge.image1x,
          image_url_2x: badge.image2x,
          image_url_4x: badge.image4x,
          title: badge.title,
          description: '',
          click_action: badge.clickAction,
          click_url: badge.clickURL,
        }));
        const subscriberBadges = { set_id: 'subscriber', versions };
        console.log({ subscriberBadges });
        cb({ data: [subscriberBadges] });
      });
    }
  };

  return { done };
};