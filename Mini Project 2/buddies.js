const Buddies = (() => {
  const STORAGE_KEY = "safewalk_groups";

  const GROUPS = [
    {
      id: "hcde", name: "Human Centered Design & Engineering",
      members: [
        { name: "Priya S.", status: "online" },
        { name: "Jordan M.", status: "offline" },
        { name: "Anika R.", status: "online" },
      ],
    },
    {
      id: "cse", name: "Computer Science & Engineering",
      members: [
        { name: "Kevin L.", status: "online" },
        { name: "Maya T.", status: "offline" },
        { name: "Sam K.", status: "online" },
        { name: "Lisa W.", status: "offline" },
      ],
    },
    {
      id: "info", name: "Information School (iSchool)",
      members: [
        { name: "David C.", status: "online" },
        { name: "Rachel P.", status: "offline" },
      ],
    },
    {
      id: "psych", name: "Psychology",
      members: [
        { name: "Emma B.", status: "online" },
        { name: "Tyler N.", status: "online" },
        { name: "Zoe H.", status: "offline" },
      ],
    },
    {
      id: "bio", name: "Biology",
      members: [
        { name: "Alex J.", status: "offline" },
        { name: "Mia F.", status: "online" },
      ],
    },
    {
      id: "business", name: "Foster School of Business",
      members: [
        { name: "Chris D.", status: "offline" },
        { name: "Noor A.", status: "online" },
        { name: "Ethan R.", status: "offline" },
      ],
    },
    {
      id: "nursing", name: "School of Nursing",
      members: [
        { name: "Sofia G.", status: "online" },
        { name: "Liam O.", status: "offline" },
      ],
    },
    {
      id: "art", name: "School of Art + Art History + Design",
      members: [
        { name: "Jade T.", status: "online" },
        { name: "Owen P.", status: "offline" },
        { name: "Isla M.", status: "online" },
      ],
    },
    {
      id: "ee", name: "Electrical & Computer Engineering",
      members: [
        { name: "Ravi S.", status: "online" },
        { name: "Anna K.", status: "offline" },
      ],
    },
    {
      id: "polisci", name: "Political Science",
      members: [
        { name: "Ben W.", status: "offline" },
        { name: "Clara Z.", status: "online" },
      ],
    },
    {
      id: "comms", name: "Communication",
      members: [
        { name: "Lily H.", status: "online" },
        { name: "James R.", status: "offline" },
        { name: "Tara S.", status: "online" },
      ],
    },
    {
      id: "chem", name: "Chemistry",
      members: [
        { name: "Oscar L.", status: "offline" },
        { name: "Nina C.", status: "online" },
      ],
    },
    {
      id: "arch", name: "Architecture",
      members: [
        { name: "Leo F.", status: "online" },
        { name: "Hannah B.", status: "offline" },
      ],
    },
    {
      id: "law", name: "School of Law",
      members: [
        { name: "Marcus J.", status: "offline" },
        { name: "Emily V.", status: "online" },
      ],
    },
    {
      id: "pubhealth", name: "School of Public Health",
      members: [
        { name: "Diana Q.", status: "online" },
        { name: "Noah G.", status: "offline" },
        { name: "Ava P.", status: "online" },
      ],
    },
  ];

  function getJoinedIds() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveJoinedIds(ids) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }

  function isJoined(groupId) {
    return getJoinedIds().includes(groupId);
  }

  function toggleGroup(groupId) {
    let ids = getJoinedIds();
    if (ids.includes(groupId)) {
      ids = ids.filter((id) => id !== groupId);
    } else {
      ids.push(groupId);
    }
    saveJoinedIds(ids);
    render();
    App.renderProfileGroups();
  }

  function getJoined() {
    const ids = getJoinedIds();
    return GROUPS.filter((g) => ids.includes(g.id)).map((g) => g.name);
  }

  function requestWalk(memberName) {
    App.toast(`Request sent to ${memberName}!`);
  }

  function render() {
    const container = document.getElementById("buddies-list");
    if (!container) return;

    const joinedIds = getJoinedIds();
    const sorted = [...GROUPS].sort((a, b) => {
      const aJoined = joinedIds.includes(a.id) ? 0 : 1;
      const bJoined = joinedIds.includes(b.id) ? 0 : 1;
      return aJoined - bJoined;
    });

    container.innerHTML = sorted.map((group) => {
      const joined = joinedIds.includes(group.id);
      const btnClass = joined ? "leave" : "join";
      const btnText = joined ? "Leave" : "Join";

      let membersHtml = "";
      if (joined) {
        membersHtml = `
          <div class="group-members">
            ${group.members.map((m) => `
              <div class="member-row">
                <div class="member-info">
                  <span class="member-name">${m.name}</span>
                  <span class="member-status ${m.status}">${m.status === "online" ? "Available now" : "Offline"}</span>
                </div>
                ${m.status === "online" ? `<button class="btn-walk" onclick="Buddies.requestWalk('${m.name}')">Walk together</button>` : ""}
              </div>
            `).join("")}
          </div>
        `;
      }

      return `
        <div class="group-card">
          <div class="group-top">
            <div>
              <div class="group-name">${group.name}</div>
              <div class="group-count">${group.members.length} members</div>
            </div>
            <button class="btn-join ${btnClass}" onclick="Buddies.toggleGroup('${group.id}')">${btnText}</button>
          </div>
          ${membersHtml}
        </div>
      `;
    }).join("");
  }

  return { render, toggleGroup, requestWalk, getJoined, isJoined };
})();
