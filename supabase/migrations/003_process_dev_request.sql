-- Function to process dev requests atomically
CREATE OR REPLACE FUNCTION process_dev_request(
  p_request_id UUID,
  p_target_user_id UUID,
  p_new_status TEXT,
  p_new_role TEXT,
  p_admin_note TEXT,
  p_notif_type TEXT,
  p_notif_message TEXT
) RETURNS VOID AS $$
BEGIN
  -- Update dev request status
  UPDATE dev_requests 
  SET status = p_new_status, 
      admin_note = p_admin_note,
      updated_at = NOW()
  WHERE id = p_request_id;

  -- Update user role if approved
  IF p_new_status = 'approved' THEN
    UPDATE users 
    SET role = p_new_role,
        updated_at = NOW()
    WHERE id = p_target_user_id;
  END IF;

  -- Insert notification
  INSERT INTO notifications (user_id, type, data, created_at)
  VALUES (p_target_user_id, p_notif_type, jsonb_build_object('message', p_notif_message), NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
