// ランキング管理クラス
class RankingManager {
    constructor() {
        this.storageKey = 'spaceStationSurvivalRanking';
        this.maxEntries = 10;
    }
    
    getRankings() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : [];
    }
    
    saveRankings(rankings) {
        localStorage.setItem(this.storageKey, JSON.stringify(rankings));
    }
    
    addScore(name, score, floor) {
        const rankings = this.getRankings();
        const newEntry = {
            name: name.toUpperCase().substring(0, 3),
            score: score,
            floor: floor,
            date: new Date().toLocaleDateString('ja-JP')
        };
        
        rankings.push(newEntry);
        rankings.sort((a, b) => b.score - a.score);
        
        if (rankings.length > this.maxEntries) {
            rankings.length = this.maxEntries;
        }
        
        this.saveRankings(rankings);
        return rankings.findIndex(entry => 
            entry.name === newEntry.name && 
            entry.score === newEntry.score && 
            entry.date === newEntry.date
        ) + 1;
    }
    
    isHighScore(score) {
        const rankings = this.getRankings();
        if (rankings.length < this.maxEntries) return true;
        return score > rankings[rankings.length - 1].score;
    }
    
    clearRankings() {
        localStorage.removeItem(this.storageKey);
    }
}