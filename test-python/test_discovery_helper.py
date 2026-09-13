import importlib.util
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("helper", Path(__file__).parents[1] / "tools/loxevo-discovery-helper.py")
helper = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helper)


class DiscoveryHelperTests(unittest.TestCase):
  def setUp(self):
    self.temp = tempfile.TemporaryDirectory()
    self.addCleanup(self.temp.cleanup)
    self.state = patch.object(helper, "STATE_FILE", Path(self.temp.name) / "state.json")
    self.state.start()
    self.addCleanup(self.state.stop)
    self.active = {"ssdpd": True, "lbssdpd": False}
    self.commands = []
    self.fail_start = False
    def systemctl(*args):
      action, name = args[0], args[-1]
      self.commands.append((action, name))
      code = 0
      if action == "status": code = 0 if self.active[name] else 3
      if action == "is-active": code = 0 if self.active[name] else 3
      if action == "stop": self.active[name] = False
      if action == "start":
        if self.fail_start: code = 1
        else: self.active[name] = True
      return subprocess.CompletedProcess(args, code, "", "")
    for target, replacement in [("systemctl", systemctl), ("port_owner", lambda: "test")]:
      mock = patch.object(helper, target, replacement)
      mock.start()
      self.addCleanup(mock.stop)

  def test_repeated_start_retains_original_state(self):
    helper.start_discovery()
    helper.start_discovery()
    self.assertEqual(helper.read_state()["previouslyActive"], ["ssdpd"])
    helper.stop_discovery()
    self.assertTrue(self.active["ssdpd"])
    self.assertFalse(self.active["lbssdpd"])

  def test_stop_without_session_never_enables_other_services(self):
    helper.stop_discovery()
    self.assertFalse(any(action == "start" for action, _ in self.commands))

  def test_failed_restore_keeps_state_for_retry(self):
    helper.start_discovery()
    self.fail_start = True
    self.assertTrue(helper.stop_discovery()["errors"])
    self.assertEqual(helper.read_state()["previouslyActive"], ["ssdpd"])
    self.fail_start = False
    self.assertFalse(helper.stop_discovery()["errors"])
    self.assertEqual(helper.read_state(), {})

  def test_corrupt_state_never_overwrites_recovery_information(self):
    helper.STATE_FILE.write_text("{broken", encoding="utf-8")
    with self.assertRaises(json.JSONDecodeError): helper.start_discovery()
    self.assertFalse(any(action == "stop" for action, _ in self.commands))

  def test_command_timeout_is_bounded_failure(self):
    with patch.object(helper.subprocess, "run", side_effect=subprocess.TimeoutExpired("test", 10)):
      self.assertEqual(helper.run_command("test").returncode, 124)


if __name__ == "__main__": unittest.main()
