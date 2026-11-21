import json,sys,collections
S=sys.argv[1]
key={k["item"]:k for k in json.load(open(f"{S}/key.json"))}
items={i["item"]:i for i in json.load(open(f"{S}/items.json"))}
panels={}
for n in "abc":
    try: panels[n]={r["item"]:r for r in json.load(open(f"{S}/panelist-{n}.json"))}
    except Exception as e: print("panelist",n,"missing/bad:",e)
def rule(exp,accept,votes):
    ok=sum(v in [exp,*accept] for v in votes)
    if ok==3: return "CONFIRMED"
    if ok==2: return "KEPT"
    c=collections.Counter(v for v in votes if v not in [exp,*accept,"open",None])
    if c and c.most_common(1)[0][1]>=2: return "CHANGE->"+c.most_common(1)[0][0]
    return "OPEN"
rows=[]
for it,k in key.items():
    if k["type"]=="single":
        votes=[panels[n].get(it,{}).get("answer") for n in panels]
        conf=[panels[n].get(it,{}).get("confidence") for n in panels]
        r=rule(k["expected"],k["alsoAccept"],votes)
        rows.append((it,k["dilemma"],k["thinker"],k["confidence"],k["expected"],votes,conf,r))
    else:
        va=[panels[n].get(it,{}).get("answerA") for n in panels]; vb=[panels[n].get(it,{}).get("answerB") for n in panels]
        conf=[panels[n].get(it,{}).get("confidence") for n in panels]
        ra=rule(k["expectedA"],[],va); rb=rule(k["expectedB"],[],vb)
        rows.append((it,k["pair"],k["thinker"],"pair "+"/".join(k["basis"].values()),f'{k["expectedA"]}→{k["expectedB"]}',[f"{a}→{b}" for a,b in zip(va,vb)],conf,f"A:{ra} B:{rb}"))
for r in rows: print(" | ".join(str(x) for x in r))
print(collections.Counter(r[-1].split(":")[0] if r[-1].startswith("A") else r[-1] for r in rows))
