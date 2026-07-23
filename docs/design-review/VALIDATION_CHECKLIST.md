# Design PR Validation Checklist

## Repository

- [ ] Correct base SHA
- [ ] Clean branch
- [ ] Narrow file scope
- [ ] No unrelated changes
- [ ] Tests pass
- [ ] Build passes
- [ ] Generated assets stable
- [ ] `git diff --check` passes

## Visual

- [ ] 1440 × 900 checked
- [ ] 1024 × 768 checked
- [ ] 768 × 1024 checked
- [ ] 430 × 932 checked
- [ ] 390 × 844 checked
- [ ] 375 × 812 checked
- [ ] No document-level overflow
- [ ] Expected stacking
- [ ] Canvas overflow contained
- [ ] Dealer Portal styling comparison completed
- [ ] Touch targets checked
- [ ] Keyboard focus checked
- [ ] Contrast checked
- [ ] Warning and error clarity checked

## Functional

- [ ] Sprinter 144 High Roof
- [ ] Sprinter 170 High Roof
- [ ] Driver wall view
- [ ] Passenger wall view
- [ ] Westcan 22-3436
- [ ] Westcan 22-3437
- [ ] Westcan 22-3438
- [ ] Westcan 22-3439
- [ ] Westcan 22-3440
- [ ] Valid placement
- [ ] Conflict placement
- [ ] Rejected incompatible placement
- [ ] Product removal
- [ ] Empty state
- [ ] Planning warning
- [ ] VIN-required payload message
- [ ] No geometry or fitment regression

## Deployment

- [ ] Merge only after approval
- [ ] `main` auto-deploys
- [ ] No manual deployment
- [ ] Staging asset marker confirmed
- [ ] Visual smoke tests repeated on staging
- [ ] Functional smoke tests repeated on staging
