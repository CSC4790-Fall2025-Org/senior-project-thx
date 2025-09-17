export const dummyData = [
    {
      id: "1",
      name: "Mya Dang",
      location: "Friar Hall",
      services: [
        {
          service_id: "1",
          name: "Haircut",
          description: "I offer haircuts for all styles like a quick trim, a fresh new look, or something special for an event!",
          price: 30.0,
          tag: "Beauty",
          availability: [
            { date: "2025-09-17", time: "10:00 AM" },
            { date: "2025-09-17", time: "2:00 PM" },
            { date: "2025-09-18", time: "1:00 PM" },
          ],
          image: require("../assets/haircuts.jpg"),
        },
        {
          service_id: "2",
          name: "Makeup",
          description: "I can do makeup for formal, parties, weddings, and any other special occations.",
          price: 20.0,
          tag: "Beauty",
          availability: [
            { date: "2025-09-18", time: "9:00 AM" },
            { date: "2025-09-18", time: "3:30 PM" },
          ],
          image: require("../assets/makeup.jpg"),
        },
      ],
    },
    {
      id: "2",
      name: "Allyssa Panganiban",
      location: "Klekotka Hall",
      services: [
        {
          service_id: "1",
          name: "Nails",
          description: "",
          price: 25.0,
          tag: "Beauty",
          availability: [
            { date: "2025-09-19", time: "11:00 AM" },
            { date: "2025-09-20", time: "4:00 PM" },
          ],
          image: require("../assets/nails.jpg"),
        },
      ],
    },
  ];
  