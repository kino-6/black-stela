extends RefCounted
## Faithful port of src/components/RecoveryPanel.tsx — the infirmary counter.
##
## The React panel's own comment states the design, and it is the acceptance bar here: "What a player
## needs here is small: who is hurt, what they will be brought back to, what each one costs, what the
## lot costs, whether they can afford it, and yes or no." Healthy members are deliberately NOT listed
## (six cards saying "no treatment" is not information — one line is).
##
## AGENTS.md: "Recovery must show cost, wounds, before/after, and insufficient-funds states."

const I18n := preload("res://scripts/i18n.gd")
const Fmt := preload("res://scripts/town_format.gd")
const UI := preload("res://scripts/town/ui_kit.gd")

static func build(ctx: Dictionary) -> Control:
	var state: Dictionary = ctx["state"]
	var party: Array = state.get("party", [])
	var party_gold := int(state.get("partyGold", 0))

	# Only the hurt appear, each with what it costs to bring them back.
	var wounded := []
	for member in party:
		var cost := Fmt.member_recovery_cost(member)
		if cost > 0:
			wounded.append({"member": member, "cost": cost})

	var recovery_cost := 0
	for entry in wounded:
		recovery_cost += int(entry["cost"])
	var affordable := party_gold >= recovery_cost
	var can_treat := recovery_cost > 0 and affordable

	var root := UI.col(12)
	root.add_child(UI.service_heading(I18n.t("town.recoveryHeading"), I18n.t("town.gold", {"gold": party_gold})))

	var last_event: String = ctx.get("event_text", "")
	if last_event != "":
		root.add_child(UI.event_window(last_event))

	if wounded.is_empty():
		root.add_child(UI.label(I18n.t("town.noRecoveryNeeded"), 18, UI.DIM))
	else:
		var plan := UI.col(4)
		for entry in wounded:
			var member: Dictionary = entry["member"]
			var line := UI.row()
			line.add_child(UI.grow(UI.label(String(member.get("name", "?")), 18, UI.INK)))
			# before → after: what this treatment actually buys for this adventurer.
			line.add_child(UI.label("%d/%d" % [int(member.get("hp", 0)), int(member.get("maxHp", 0))], 17, UI.BAD))
			line.add_child(UI.label("→", 17, UI.DIM))
			line.add_child(UI.label(str(int(member.get("maxHp", 0))), 17, UI.OK))
			if member.get("injury", null) != null:
				line.add_child(UI.label(I18n.t("status.%s" % String(member.get("injury"))), 15, UI.BAD))
			line.add_child(UI.label(I18n.t("town.gold", {"gold": int(entry["cost"])}), 17, UI.INK))
			plan.add_child(UI.card(line))
		root.add_child(plan)

	if recovery_cost > 0:
		var total := UI.row()
		total.add_child(UI.grow(UI.label(I18n.t("town.afterRecovery", {"count": wounded.size()}), 17, UI.DIM)))
		total.add_child(UI.label(I18n.t("town.recoveryCost", {"gold": recovery_cost}), 20, UI.INK if affordable else UI.BAD))
		root.add_child(total)
		if not affordable:
			root.add_child(UI.label(I18n.t("town.cannotAffordRecovery"), 17, UI.BAD))

	root.add_child(UI.gap(6))
	var actions := UI.row()
	var confirm := UI.button(I18n.t("town.recoverParty"), func(): ctx["dispatch"].call({"type": "recover_party"}), Vector2(240, 48), 19)
	confirm.disabled = not can_treat
	actions.add_child(confirm)
	actions.add_child(UI.button(I18n.t("town.serviceCancel"), ctx["close"], Vector2(180, 48), 18))
	root.add_child(actions)

	# The cursor starts on the command the player came here to give.
	ctx["focus_hint"].call(confirm if can_treat else null)
	return root
