export const dummyData = [
    {
      id: "1",
      name: "Mya Dang",
      location: "Friar Hall",
      services: [
        {
          provider: "Mya Dang",
          service: "Mya's Hair Dye",
          description: "You can get a box dye with the color of your choice before.",
          price: 10,
          tag: "Haircuts",
          imageUri: require('../assets/haircuts.jpg'),
          availability: {
            "2025-09-18": [
              {
                "start": "2025-09-18T14:00:00.000Z",
                "end": "2025-09-18T15:00:00.000Z"
              }
            ],
            "2025-09-30": [
              {
                "start": "2025-09-30T17:00:00.000Z",
                "end": "2025-09-30T18:00:00.000Z"
              },
              {
                "start": "2025-09-30T21:00:00.000Z",
                "end": "2025-09-30T22:00:00.000Z"
              }
            ]
          }
        },
        {
          provider: "Mya Dang",
          service: "Makeup",
          description: "I can do makeup for formal, parties, weddings, and any other special occations.",
          price: 20.0,
          tag: "Beauty",
          imageUri: require('../assets/makeup.png'),
          availability: {
            "2025-09-18": [
              {
                "start": "2025-09-18T14:00:00.000Z",
                "end": "2025-09-18T15:00:00.000Z"
              }
            ],
          },
        },
      ],
    },
    {
      id: "2",
      name: "Allyssa Panganiban",
      location: "Klekotka Hall",
      services: [
        {
          provider: "Allyssa Panganiban",
          service: "allyssa's pangaNails",
          description: "etc etc",
          price: 20.0,
          tag: "Beauty",
          imageUri: require('../assets/makeup.png'),
          availability: {
            "2025-09-19": [
              {
                "start": "2025-09-19T14:00:00.000Z",
                "end": "2025-09-19T15:00:00.000Z"
              }
            ],
            "2025-09-20": [
              {
                "start": "2025-09-20T12:00:00.000Z",
                "end": "2025-09-20T19:00:00.000Z"
              }
            ]
          },
        },
        {
          provider: "Allyssa Panganiban",
          service: "allysSnips",
          description: "get it",
          price: 40.0,
          tag: "Cooking",
          imageUri: require('../assets/haircuts.jpg'),
          availability: {
            "2025-09-30": [
              {
                "start": "2025-09-30T14:00:00.000Z",
                "end": "2025-09-30T15:00:00.000Z"
              }
            ],
            "2025-09-21": [
              {
                "start": "2025-09-21T12:00:00.000Z",
                "end": "2025-09-21T19:00:00.000Z"
              }
            ]
          }, 
        }
      ],
    },
  ];
