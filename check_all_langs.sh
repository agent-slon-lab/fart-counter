#!/bin/bash
# Verify medical dashboard renders correctly in all 7 languages
cd /home/z/my-project

LANGS=("ru:Russian" "en:English" "es:Spanish" "pt:Portuguese" "de:German" "fr:French" "hi:Hindi")

# Function: get Insights tab ref (3rd button inside navigation block)
get_insights_ref() {
  agent-browser snapshot -i 2>/dev/null | awk '
    /^- navigation/ { in_nav=1; next }
    in_nav && /^- region/ { in_nav=0 }
    in_nav && /^  - button/ {
      match($0, /\[ref=e[0-9]+\]/);
      if (RSTART > 0) {
        s = substr($0, RSTART+5, RLENGTH-6);
        print s;
      }
    }
  ' | sed -n '3p'  # 3rd button = Insights
}

# One-time: inject test data + medical mode
echo "=== Injecting test data ==="
agent-browser eval "(function(){
const KEY = 'fart-counter-store-v2';
const now = Date.now();
const DAY = 86400000; const HOUR = 3600000;
function rnd(a){return a[Math.floor(Math.random()*a.length)];}
function rndInt(a,b){return Math.floor(Math.random()*(b-a+1))+a;}
const poops = []; const food = []; const water = []; const walks = [];
const PRESET = ['food_beans','food_cabbage','food_dairy','food_onion','food_bread','food_apple','food_mushroom','food_coffee','food_beer','food_garlic','food_egg','food_rice','food_potato','food_fish','food_banana','food_broccoli','food_cheese','food_carrot','food_corn','food_meat','food_pepper','food_sweets','food_soda','food_fastfood'];
for (let d = 30; d >= 0; d--) {
  const dayTs = now - d*DAY;
  const nFood = rndInt(1,3);
  for (let i=0;i<nFood;i++){
    const h = rnd([7,8,9,12,13,18,19,20,21]);
    food.push({id:'f'+d+'_'+i, ts:new Date(dayTs+h*HOUR).toISOString(), name:rnd(PRESET), portion:rnd(['small','medium','large']), profileId:'me'});
  }
  const nP = Math.random()<0.7?1:2;
  for (let i=0;i<nP;i++){
    const h = rnd([7,8,9,10,12,13,14,18,19,20,21,22,23]);
    const ts = dayTs + h*HOUR;
    const bristol = rnd([1,2,3,3,4,4,4,4,5,5,6,6,7]);
    const hasSym = Math.random()<0.65;
    const symptoms = hasSym ? rnd(['bloating,pain','cramps','borborygmi','pain,nausea','bloating,cramps','heartburn']) : null;
    poops.push({id:'p'+d+'_'+i, ts:new Date(ts).toISOString(), bristolType:bristol, symptoms:symptoms, tenesmus:bristol<=2&&Math.random()<0.6, incomplete:bristol<=3&&Math.random()<0.5, painLevel:hasSym&&Math.random()<0.7?rndInt(1,8):null, profileId:'me'});
  }
  water.push({date:new Date(dayTs).toISOString().slice(0,10), count:rndInt(2,8), profileId:'me'});
  if (Math.random()<0.6) walks.push({id:'w'+d, ts:new Date(dayTs+17*HOUR).toISOString(), minutes:rnd([15,20,30,45,60]), profileId:'me'});
}
const existing = JSON.parse(localStorage.getItem(KEY) || '{}');
const existingState = existing.state || {};
const existingSettings = existingState.settings || {};
const fullState = {
  farts: existingState.farts || [], water, food, moods: existingState.moods || [],
  weather: existingState.weather || [], poops, walks,
  worldRank: existingState.worldRank || {},
  profiles: existingState.profiles && existingState.profiles.length ? existingState.profiles : [{id:'me',name:'Me',type:'adult',avatar:'🧑'}],
  customFoods: existingState.customFoods || [],
  xp: existingState.xp || 0, maxXp: existingState.maxXp || 0,
  streak: existingState.streak || 0,
  lastFartDay: existingState.lastFartDay || null, lastBonusDay: existingState.lastBonusDay || null,
  purchasedItems: existingState.purchasedItems || [],
  fartsTodayForXP: existingState.fartsTodayForXP || 0,
  activeBadge: existingState.activeBadge || null,
  settings: {
    language: 'en', theme: existingSettings.theme || 'light',
    accent: existingSettings.accent || 'green',
    soundEnabled: existingSettings.soundEnabled ?? true,
    vibrationEnabled: existingSettings.vibrationEnabled ?? true,
    notificationsEnabled: existingSettings.notificationsEnabled ?? false,
    eveningReminder: existingSettings.eveningReminder ?? true,
    waterReminder: existingSettings.waterReminder ?? false,
    morningReminder: existingSettings.morningReminder ?? false,
    gentleReminder: existingSettings.gentleReminder ?? false,
    fartSound: existingSettings.fartSound || 'classic',
    geoEnabled: existingSettings.geoEnabled ?? false,
    weatherEnabled: existingSettings.weatherEnabled ?? false,
    bowelTrackingEnabled: true,
    walkReminderEnabled: existingSettings.walkReminderEnabled ?? true,
    appMode: 'medical', activeProfileId: 'me',
  },
  unlockedAchievements: existingState.unlockedAchievements || [],
};
localStorage.setItem(KEY, JSON.stringify({state: fullState, version: 9}));
localStorage.setItem('fart-counter-onboarded', '1');
const today = new Date().toISOString().slice(0,10);
localStorage.setItem('fart-counter-welcome-shown-' + today, '1');
localStorage.setItem('fart-counter-last-update-check', String(Date.now()));
return 'injected: ' + poops.length + ' poops, ' + food.length + ' food';
})()" 2>&1 | tail -1

for entry in "${LANGS[@]}"; do
  code="${entry%%:*}"
  name="${entry##*:}"

  echo ""
  echo "=== $name ($code) ==="

  agent-browser eval "(function(){
const KEY='fart-counter-store-v2';
const data = JSON.parse(localStorage.getItem(KEY) || '{}');
data.state.settings.language = '$code';
data.state.settings.appMode = 'medical';
localStorage.setItem(KEY, JSON.stringify(data));
return 'lang=$code';
})()" 2>&1 | tail -1

  agent-browser reload > /dev/null 2>&1
  sleep 5
  agent-browser eval "(function(){document.querySelectorAll('nextjs-portal,.fixed.inset-0,[role=dialog]').forEach(e=>e.remove());return 'cleared';})()" > /dev/null 2>&1
  sleep 1

  REF=$(get_insights_ref)

  if [ -n "$REF" ]; then
    agent-browser click "$REF" > /dev/null 2>&1
    sleep 4
    agent-browser screenshot --full "/tmp/dash-$code.png" > /dev/null 2>&1
    echo "[$name] OK screenshot (ref=$REF)"
  else
    echo "[$name] could not find Insights tab"
    agent-browser snapshot -i 2>&1 | head -20
  fi
done

echo ""
echo "=== ALL DONE ==="
ls -la /tmp/dash-*.png 2>/dev/null
