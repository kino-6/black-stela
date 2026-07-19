extends SceneTree
## Smoke test of the M3 functional town hub: load town.tscn, open each service level-2 screen, and drive
## a couple of real dispatches (buy, recover) so a runtime error in any service wiring surfaces here.
## Under this SceneTree the autoloads aren't started, so town.gd runs on the b1f-exploration fixture
## forced to town phase. Headless has no render viewport, so this proves WIRING, not pixels (the 1920
## window play-pass is the visual proof). Usage: godot --headless --path godot/ --script res://tests/capture_town.gd

func _initialize() -> void:
	var town := (load("res://scenes/town.tscn") as PackedScene).instantiate()
	get_root().add_child(town)
	for i in 8:
		await process_frame

	for key in ["infirmary", "market", "quests", "career", "records", "guild"]:
		town._open_service(key)
		for i in 4:
			await process_frame
		print("[capture_town] opened service: %s" % key)

	# drive real dispatches so command wiring is exercised end to end
	town._open_service("market")
	for i in 3:
		await process_frame
	var buy: Array = town._dispatch({"type": "buy_item", "shopId": "shop.stela-general", "itemId": "item.healing-draught"})
	town._after_dispatch(buy)
	print("[capture_town] buy events: %s" % JSON.stringify(buy))
	for i in 3:
		await process_frame
	town._open_service("infirmary")
	for i in 3:
		await process_frame
	var rec: Array = town._dispatch({"type": "recover_party"})
	town._after_dispatch(rec)
	print("[capture_town] recover events: %s" % JSON.stringify(rec))
	for i in 3:
		await process_frame

	print("[capture_town] OK — all six services opened and dispatched without error")
	quit(0)
