resource "aws_dynamodb_table" "player_progress" {
  name           = "${var.project_name}-player-progress"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "player_id"
  range_key      = "game_id"

  attribute {
    name = "player_id"
    type = "S"
  }

  attribute {
    name = "game_id"
    type = "S"
  }

  tags = {
    Name = "${var.project_name}-player-progress"
  }
}