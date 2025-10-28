resource "aws_dynamodb_table" "counters" {
  name = "jb_counters"
  billing_mode = "PAY_PER_REQUEST"
  hash_key = "name"

  attribute {
    name = "name"
    type = "S"
  }
}

resource "aws_dynamodb_table" "prompt_templates" {
  name = "jb_prompt_templates"
  billing_mode = "PAY_PER_REQUEST"
  hash_key = "component_id"

  attribute {
    name = "component_id"
    type = "N"
  }

  attribute {
    name = "template_id"
    type = "S"
  }

  attribute {
    name = "ordering"
    type = "S"
  }

  global_secondary_index {
    name = "template-index"
    hash_key = "template_id"
    range_key = "ordering"
    projection_type = "ALL"
  }
}

resource "aws_dynamodb_table" "levels" {
  name = "jb_levels"
  billing_mode = "PAY_PER_REQUEST"
  hash_key = "level_id"

  attribute {
    name = "level_id"
    type = "N"
  }
}
