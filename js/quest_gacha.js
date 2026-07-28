const QUEST_POOL = [
  { id: "play_3_games", title: "Frequent Flyer", description: "Play 3 games today.", target: 3, type: "accumulate" },
  { id: "score_20", title: "Skilled Aviator", description: "Score 20 points in a single run.", target: 20, type: "single" },
  { id: "pass_50_pipes", title: "Endurance", description: "Pass 50 pipes total.", target: 50, type: "accumulate" },
  { id: "use_shield_2", title: "Defensive", description: "Collect 2 Shield power-ups total.", target: 2, type: "accumulate" },
  { id: "score_50", title: "Pro Player", description: "Score 50 points in a single run.", target: 50, type: "single" }
];

const PREMIUM_SKINS = [
  { shape: "dragon", name: "Crimson Dragon", rate: 0.15 },
  { shape: "phoenix", name: "Solar Phoenix", rate: 0.10 },
  { shape: "mech", name: "Mecha Wing (NEW)", rate: 0.05 },
  { shape: "nebula", name: "Cosmic Nebula (NEW)", rate: 0.02 },
  { shape: "butterfly", name: "Crystal Butterfly", rate: 0.20 },
  { shape: "rocket", name: "Jetpack Rocket", rate: 0.20 }
];

class QuestManager {
  constructor(storage, ui) {
    this.storage = storage;
    this.ui = ui;
    this.quests = [];
    this.checkDailyReset();
  }

  checkDailyReset() {
    const today = new Date().toDateString();
    if (this.storage.data.lastQuestDate !== today) {
      this.generateNewQuests(today);
    } else {
      this.quests = this.storage.getQuests();
    }
  }

  generateNewQuests(today) {
    // Pick 3 random quests
    const shuffled = [...QUEST_POOL].sort(() => 0.5 - Math.random());
    this.quests = shuffled.slice(0, 3).map(q => ({
      ...q,
      progress: 0,
      status: "active" // active, completed, claimed
    }));
    this.storage.saveQuests(this.quests, today);
  }

  emit(event, value) {
    let updated = false;
    this.quests.forEach(q => {
      if (q.status !== "active") return;

      if (q.type === "accumulate") {
        if (event === "game_played" && q.id === "play_3_games") {
          q.progress++;
        } else if (event === "pipe_passed" && q.id === "pass_50_pipes") {
          q.progress++;
        } else if (event === "power_up" && value === "shield" && q.id === "use_shield_2") {
          q.progress++;
        }
      } else if (q.type === "single") {
        if (event === "score_update" && q.id === "score_20" && value >= 20) {
          q.progress = 20;
        } else if (event === "score_update" && q.id === "score_50" && value >= 50) {
          q.progress = 50;
        }
      }

      if (q.progress >= q.target) {
        q.progress = q.target;
        q.status = "completed";
        this.ui.toast("Quest Completed", q.title);
      }
      updated = true;
    });

    if (updated) {
      this.storage.saveQuests(this.quests, this.storage.data.lastQuestDate);
    }
  }

  claimQuest(index) {
    const q = this.quests[index];
    if (q && q.status === "completed") {
      q.status = "claimed";
      this.storage.addTickets(1);
      this.storage.saveQuests(this.quests, this.storage.data.lastQuestDate);
      return true;
    }
    return false;
  }
}

class GachaSystem {
  constructor(storage, ui) {
    this.storage = storage;
    this.ui = ui;
  }

  draw() {
    if (!this.storage.spendTicket()) {
      return { success: false, message: "Not enough tickets!" };
    }

    const rand = Math.random();
    let cumulative = 0;
    for (const skin of PREMIUM_SKINS) {
      cumulative += skin.rate;
      if (rand <= cumulative) {
        this.storage.unlockSkin(skin.shape);
        return { success: true, shape: skin.shape, name: skin.name, isNew: true };
      }
    }
    
    // Fallback if nothing hits (shouldn't happen if rates sum to < 1, which they do: 0.15+0.1+0.05+0.02+0.2+0.2 = 0.72)
    // Means 28% chance to get nothing or duplicate
    return { success: true, shape: null, message: "Empty chest... better luck next time!" };
  }
}
